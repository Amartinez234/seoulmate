// Sincronización opcional con Supabase. Los datos salen del dispositivo ya cifrados con una
// "contraseña de sincronización" (cifrado de extremo a extremo): el servidor solo guarda texto
// cifrado, y además las políticas RLS impiden que un usuario lea filas de otro.
import { deriveKey, fromB64, PBKDF2_ITERATIONS, randomBytes, seal, toB64, unseal, type Sealed } from './crypto';
import { allDocs } from './store';
import { getSecret, getSecretUpdatedAt, listSecretNames, putSecret } from './vault';
import { clearMediaCache } from './media';
import { idb } from './db';

const LAST_SYNC_KEY = 'meta:lastSync';

export interface RemoteRow extends Sealed {
  name: string;
  updatedAt: number;
}

export interface RemoteMeta {
  salt: string;
  iterations: number;
  check: Sealed;
}

/** Lo mínimo que la sincronización necesita del servidor (permite probarla sin red). */
export interface RemoteStore {
  getMeta(): Promise<RemoteMeta | null>;
  putMeta(meta: RemoteMeta): Promise<void>;
  listRecords(): Promise<Array<{ name: string; updatedAt: number }>>;
  getRecords(names: string[]): Promise<RemoteRow[]>;
  putRecords(rows: RemoteRow[]): Promise<void>;
}

const CHECK = 'seoulmate-sync-ok';

export function syncConfigured(): boolean {
  return Boolean(import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY);
}

export async function syncKeyFor(remote: RemoteStore, syncPass: string): Promise<CryptoKey> {
  if (syncPass.length < 8) throw new Error('La contraseña de sincronización debe tener al menos 8 caracteres.');
  const meta = await remote.getMeta();
  if (!meta) {
    const salt = randomBytes(16);
    const key = await deriveKey(syncPass, salt, PBKDF2_ITERATIONS);
    await remote.putMeta({ salt: toB64(salt), iterations: PBKDF2_ITERATIONS, check: await seal(key, CHECK) });
    return key;
  }
  const key = await deriveKey(syncPass, fromB64(meta.salt), meta.iterations);
  try {
    if ((await unseal<string>(key, meta.check)) === CHECK) return key;
  } catch {
    /* cae al error */
  }
  throw new Error('La contraseña de sincronización no coincide con la de tu cuenta.');
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/** Última escritura gana, por registro (documento o imagen). */
export async function syncNow(remote: RemoteStore, syncPass: string): Promise<SyncResult> {
  const key = await syncKeyFor(remote, syncPass);
  const localNames = await listSecretNames();
  const remoteList = await remote.listRecords();
  const remoteTimes = new Map(remoteList.map((r) => [r.name, r.updatedAt]));
  // En la primera sincronización de un dispositivo, lo que ya está en la nube tiene prioridad
  // (así un teléfono nuevo no pisa los datos existentes con su configuración inicial).
  const firstSync = (await idb.get<number>(LAST_SYNC_KEY)) === undefined;
  const toPush: RemoteRow[] = [];
  const toPull: string[] = [];
  for (const name of localNames) {
    const lt = (await getSecretUpdatedAt(name)) ?? 0;
    const rt = remoteTimes.get(name);
    if (firstSync && rt !== undefined) toPull.push(name);
    else if (rt === undefined || lt > rt) {
      const value = await getSecret(name);
      toPush.push({ name, updatedAt: lt, ...(await seal(key, value)) });
    } else if (rt > lt) toPull.push(name);
  }
  for (const r of remoteList) if (!localNames.includes(r.name)) toPull.push(r.name);
  if (toPush.length) await remote.putRecords(toPush);
  let pulled = 0;
  if (toPull.length) {
    const rows = await remote.getRecords(toPull);
    for (const row of rows) {
      const value = await unseal<unknown>(key, row);
      const doc = allDocs.find((d) => d.name === row.name);
      if (doc) await doc.replace(value, row.updatedAt);
      else await putSecret(row.name, value, row.updatedAt);
      pulled++;
    }
    clearMediaCache();
  }
  await idb.set(LAST_SYNC_KEY, Date.now());
  return { pushed: toPush.length, pulled };
}

// ---------- Adaptador Supabase ----------
type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;
let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  if (!syncConfigured()) return Promise.reject(new Error('La sincronización no está configurada.'));
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    }),
  );
  return clientPromise;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function supabaseRemote(sb: SupabaseClient, userId: string): RemoteStore {
  return {
    async getMeta() {
      const data = check(await sb.from('seoulmate_sync_meta').select('salt, iterations, check_iv, check_ct').maybeSingle());
      if (!data) return null;
      return { salt: data.salt, iterations: data.iterations, check: { iv: data.check_iv, ct: data.check_ct } };
    },
    async putMeta(m) {
      check(
        await sb.from('seoulmate_sync_meta').insert({
          user_id: userId,
          salt: m.salt,
          iterations: m.iterations,
          check_iv: m.check.iv,
          check_ct: m.check.ct,
        }),
      );
    },
    async listRecords() {
      const data = check(await sb.from('seoulmate_records').select('name, updated_at_ms'));
      return (data ?? []).map((r: { name: string; updated_at_ms: number }) => ({ name: r.name, updatedAt: Number(r.updated_at_ms) }));
    },
    async getRecords(names) {
      const out: RemoteRow[] = [];
      for (let i = 0; i < names.length; i += 50) {
        const data = check(
          await sb.from('seoulmate_records').select('name, iv, ct, updated_at_ms').in('name', names.slice(i, i + 50)),
        );
        for (const r of data ?? []) out.push({ name: r.name, iv: r.iv, ct: r.ct, updatedAt: Number(r.updated_at_ms) });
      }
      return out;
    },
    async putRecords(rows) {
      for (const r of rows) {
        check(
          await sb
            .from('seoulmate_records')
            .upsert({ user_id: userId, name: r.name, iv: r.iv, ct: r.ct, updated_at_ms: r.updatedAt }, { onConflict: 'user_id,name' }),
        );
      }
    },
  };
}
