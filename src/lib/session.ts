// Estado de sesión en memoria (no se guarda): modo autor para editar "Nuestro capítulo".
import { useSyncExternalStore } from 'react';
import { fromB64, hashPin, randomBytes, toB64 } from './crypto';
import { settingsDoc } from './docs';

let authorMode = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useAuthorMode(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => authorMode,
  );
}

export function setAuthorMode(v: boolean): void {
  authorMode = v;
  emit();
}

export function validatePin(pin: string): string | null {
  if (!/^\d{4,8}$/.test(pin)) return 'El PIN debe tener entre 4 y 8 números.';
  return null;
}

export async function setAuthorPin(pin: string): Promise<void> {
  const err = validatePin(pin);
  if (err) throw new Error(err);
  const salt = randomBytes(16);
  const hash = await hashPin(pin, salt);
  await settingsDoc.update((s) => ({ ...s, authorPin: { salt: toB64(salt), hash } }));
}

export async function verifyAuthorPin(pin: string): Promise<boolean> {
  const ap = settingsDoc.get().authorPin;
  if (!ap) return true;
  return (await hashPin(pin, fromB64(ap.salt))) === ap.hash;
}
