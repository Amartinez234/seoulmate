// Envoltorio mínimo de IndexedDB: un único almacén clave/valor.
const DB_NAME = 'seoulmate';
const STORE = 'records';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error('No se pudo abrir la base de datos local'));
      };
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error ?? req.error ?? new Error('Error de base de datos'));
    tx.onabort = () => reject(tx.error ?? new Error('Operación cancelada (¿almacenamiento lleno?)'));
  });
}

export const idb = {
  get<T>(key: string): Promise<T | undefined> {
    return run<T | undefined>('readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  async set(key: string, value: unknown): Promise<void> {
    await run('readwrite', (s) => s.put(value, key));
  },
  async del(key: string): Promise<void> {
    await run('readwrite', (s) => s.delete(key));
  },
  async keys(): Promise<string[]> {
    const ks = await run('readonly', (s) => s.getAllKeys());
    return ks.map(String);
  },
  async clear(): Promise<void> {
    await run('readwrite', (s) => s.clear());
  },
};

/** Solo para pruebas: olvida la conexión abierta. */
export function _resetDbConnection(): void {
  dbPromise = null;
}
