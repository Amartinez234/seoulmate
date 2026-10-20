// La "bóveda": todo el contenido se guarda cifrado con una clave derivada de la contraseña.
// La clave vive solo en memoria mientras la app está desbloqueada.
import { idb } from './db';
import { deriveKey, fromB64, PBKDF2_ITERATIONS, randomBytes, seal, toB64, unseal, type Sealed } from './crypto';

const META_KEY = 'meta:vault';
const ATTEMPTS_KEY = 'meta:attempts';
const REC_PREFIX = 'rec:';
const CHECK_VALUE = 'seoulmate-ok';
export const MIN_PASSPHRASE = 6;

interface VaultMeta {
  v: 1;
  salt: string;
  iterations: number;
  check: Sealed;
}

export interface StoredRecord extends Sealed {
  updatedAt: number;
}

let key: CryptoKey | null = null;
const lockListeners = new Set<() => void>();

export function onLock(fn: () => void): () => void {
  lockListeners.add(fn);
  return () => lockListeners.delete(fn);
}

export function isUnlocked(): boolean {
  return key !== null;
}

export async function isVaultSetUp(): Promise<boolean> {
  return (await idb.get<VaultMeta>(META_KEY)) !== undefined;
}

export function validatePassphrase(pass: string): string | null {
  if (pass.trim().length < MIN_PASSPHRASE) return `Usá al menos ${MIN_PASSPHRASE} caracteres.`;
  if (pass.length > 200) return 'Es demasiado larga.';
  return null;
}

export async function createVault(pass: string): Promise<void> {
  const err = validatePassphrase(pass);
  if (err) throw new Error(err);
  if (await isVaultSetUp()) throw new Error('Ya existe una bóveda en este dispositivo.');
  const salt = randomBytes(16);
  const k = await deriveKey(pass, salt, PBKDF2_ITERATIONS);
  const meta: VaultMeta = { v: 1, salt: toB64(salt), iterations: PBKDF2_ITERATIONS, check: await seal(k, CHECK_VALUE) };
  await idb.set(META_KEY, meta);
  key = k;
}

async function keyFor(pass: string, meta: VaultMeta): Promise<CryptoKey | null> {
  const k = await deriveKey(pass, fromB64(meta.salt), meta.iterations);
  try {
    return (await unseal<string>(k, meta.check)) === CHECK_VALUE ? k : null;
  } catch {
    return null;
  }
}

/** Espera progresiva tras varios intentos fallidos (además del costo de PBKDF2). */
export async function unlockDelayMs(): Promise<number> {
  const a = (await idb.get<{ count: number; last: number }>(ATTEMPTS_KEY)) ?? { count: 0, last: 0 };
  if (a.count < 5) return 0;
  const wait = Math.min(60_000, 2 ** (a.count - 5) * 2_000);
  return Math.max(0, a.last + wait - Date.now());
}

export async function unlockVault(pass: string): Promise<boolean> {
  const meta = await idb.get<VaultMeta>(META_KEY);
  if (!meta) throw new Error('Todavía no hay una bóveda creada.');
  const k = await keyFor(pass, meta);
  if (!k) {
    const a = (await idb.get<{ count: number; last: number }>(ATTEMPTS_KEY)) ?? { count: 0, last: 0 };
    await idb.set(ATTEMPTS_KEY, { count: a.count + 1, last: Date.now() });
    return false;
  }
  await idb.del(ATTEMPTS_KEY);
  key = k;
  return true;
}

export function lockVault(): void {
  if (!key) return;
  key = null;
  lockListeners.forEach((fn) => fn());
}

function requireKey(): CryptoKey {
  if (!key) throw new Error('La app está bloqueada.');
  return key;
}

export async function putSecret(name: string, value: unknown, updatedAt = Date.now()): Promise<void> {
  const sealed = await seal(requireKey(), value);
  const rec: StoredRecord = { ...sealed, updatedAt };
  await idb.set(REC_PREFIX + name, rec);
}

export async function getSecret<T>(name: string): Promise<T | undefined> {
  const rec = await idb.get<StoredRecord>(REC_PREFIX + name);
  if (!rec) return undefined;
  return unseal<T>(requireKey(), rec);
}

export async function getSecretUpdatedAt(name: string): Promise<number | undefined> {
  return (await idb.get<StoredRecord>(REC_PREFIX + name))?.updatedAt;
}

export async function deleteSecret(name: string): Promise<void> {
  await idb.del(REC_PREFIX + name);
}

export async function listSecretNames(prefix = ''): Promise<string[]> {
  return (await idb.keys())
    .filter((k) => k.startsWith(REC_PREFIX + prefix))
    .map((k) => k.slice(REC_PREFIX.length));
}

export async function changePassphrase(oldPass: string, newPass: string): Promise<void> {
  const err = validatePassphrase(newPass);
  if (err) throw new Error(err);
  const meta = await idb.get<VaultMeta>(META_KEY);
  if (!meta) throw new Error('No hay bóveda.');
  const oldKey = await keyFor(oldPass, meta);
  if (!oldKey) throw new Error('La contraseña actual no es correcta.');
  const salt = randomBytes(16);
  const newKey = await deriveKey(newPass, salt, PBKDF2_ITERATIONS);
  const names = await listSecretNames();
  // Primero se descifra todo; si algo falla no se toca nada.
  const plain: Array<[string, unknown, number]> = [];
  for (const n of names) {
    const rec = (await idb.get<StoredRecord>(REC_PREFIX + n))!;
    plain.push([n, await unseal(oldKey, rec), rec.updatedAt]);
  }
  for (const [n, v, t] of plain) {
    await idb.set(REC_PREFIX + n, { ...(await seal(newKey, v)), updatedAt: t } satisfies StoredRecord);
  }
  await idb.set(META_KEY, {
    v: 1,
    salt: toB64(salt),
    iterations: PBKDF2_ITERATIONS,
    check: await seal(newKey, CHECK_VALUE),
  } satisfies VaultMeta);
  key = newKey;
}

/** Borra absolutamente todo lo guardado en este dispositivo. */
export async function wipeEverything(): Promise<void> {
  key = null;
  await idb.clear();
  lockListeners.forEach((fn) => fn());
}
