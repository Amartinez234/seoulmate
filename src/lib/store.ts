// Documentos reactivos persistidos (cifrados) en la bóveda.
import { useSyncExternalStore } from 'react';
import { getSecret, putSecret } from './vault';

type Listener = () => void;

export interface Doc<T> {
  readonly name: string;
  get(): T;
  subscribe(fn: Listener): () => void;
  update(fn: (d: T) => T): Promise<void>;
  /** Reemplaza el contenido (importación o sincronización). */
  replace(value: T, updatedAt?: number): Promise<void>;
  load(): Promise<void>;
  reset(): void;
  normalize(raw: unknown): T;
}

const errorListeners = new Set<(e: unknown) => void>();
export function onSaveError(fn: (e: unknown) => void): () => void {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

export const allDocs: Doc<unknown>[] = [];

export function createDoc<T extends object>(name: string, defaults: () => T): Doc<T> {
  let value: T = defaults();
  const listeners = new Set<Listener>();
  let queue: Promise<void> = Promise.resolve();
  const emit = () => listeners.forEach((l) => l());
  const normalize = (raw: unknown): T => {
    // Completa campos nuevos con valores por defecto (migración suave).
    const base = defaults();
    if (!raw || typeof raw !== 'object') return base;
    return { ...base, ...(raw as Partial<T>) };
  };
  const persist = (v: T, updatedAt?: number) => {
    queue = queue
      .then(() => putSecret(name, v, updatedAt))
      .catch((e) => {
        errorListeners.forEach((fn) => fn(e));
      });
    return queue;
  };
  const doc: Doc<T> = {
    name,
    get: () => value,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    update(fn) {
      value = fn(value);
      emit();
      return persist(value);
    },
    replace(v, updatedAt) {
      value = normalize(v);
      emit();
      return persist(value, updatedAt);
    },
    async load() {
      value = normalize(await getSecret<T>(name));
      emit();
    },
    reset() {
      value = defaults();
      emit();
    },
    normalize,
  };
  allDocs.push(doc as Doc<unknown>);
  return doc;
}

export function useDoc<T>(doc: Doc<T>): T {
  return useSyncExternalStore(doc.subscribe, doc.get, doc.get);
}

export async function loadAllDocs(): Promise<void> {
  await Promise.all(allDocs.map((d) => d.load()));
}

export function resetAllDocs(): void {
  allDocs.forEach((d) => d.reset());
}

// ---------- utilidades de colecciones ----------
export function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

export function newId(): string {
  return crypto.randomUUID();
}
