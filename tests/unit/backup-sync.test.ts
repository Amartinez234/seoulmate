import { describe, expect, it } from 'vitest';
import { createVault, getSecret, lockVault, unlockVault } from '../../src/lib/vault';
import { chapterDoc, personalDoc, btsDoc } from '../../src/lib/docs';
import { loadAllDocs, resetAllDocs } from '../../src/lib/store';
import { applyBackup, collectContent, decryptBackup, encryptBackup, mergeChapter } from '../../src/lib/backup';
import { saveMediaData, clearMediaCache } from '../../src/lib/media';
import { syncNow, type RemoteMeta, type RemoteRow, type RemoteStore } from '../../src/lib/sync';
import { _resetDbConnection } from '../../src/lib/db';
import { IDBFactory } from 'fake-indexeddb';
import type { ChapterData } from '../../src/lib/types';

async function fresh(pass = 'clave-local') {
  await createVault(pass);
  await loadAllDocs();
}

function switchDevice() {
  lockVault();
  resetAllDocs();
  clearMediaCache();
  _resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
}

describe('copias de seguridad', () => {
  it('el paquete del capítulo nunca incluye el diario y respeta cartas abiertas', async () => {
    await fresh();
    await saveMediaData('img1', 'data:image/jpeg;base64,AAAA');
    await chapterDoc.update((c) => ({
      ...c,
      togetherSince: '2024-02-14',
      letters: [{ id: 'l1', title: 'Carta', body: 'Te quiero', unlockDate: null, openedAt: null, createdAt: 1 }],
      photos: [{ id: 'p1', imageId: 'img1', caption: 'Foto', date: '2025-01-01' }],
    }));
    await personalDoc.update((p) => ({ ...p, diary: [{ id: 'd', date: '2026-10-16', title: 'secreto', body: 'muy privado', mood: '', createdAt: 1, updatedAt: 1 }] }));
    const content = await collectContent('chapter');
    expect(JSON.stringify(content)).not.toContain('muy privado');
    expect(content.media.img1).toBeDefined();
    const file = await encryptBackup('chapter', content, 'codigo-regalo');
    const text = JSON.stringify(file);
    expect(text).not.toContain('Te quiero');
    await expect(decryptBackup(text, 'otra-clave')).rejects.toThrow(/incorrecta/);
    await expect(decryptBackup('{}', 'x')).rejects.toThrow(/no es una copia/);

    // Otro dispositivo (el de ella) con una carta ya abierta
    switchDevice();
    await fresh('clave-de-ella');
    await chapterDoc.update((c) => ({ ...c, letters: [{ id: 'l1', title: 'Carta', body: 'viejo', unlockDate: null, openedAt: 123, createdAt: 1 }] }));
    const { kind, content: got } = await decryptBackup(text, 'codigo-regalo');
    expect(kind).toBe('chapter');
    await applyBackup(kind, got);
    const c = chapterDoc.get();
    expect(c.letters[0].body).toBe('Te quiero');
    expect(c.letters[0].openedAt).toBe(123);
    expect(c.togetherSince).toBe('2024-02-14');
    expect(personalDoc.get().diary).toHaveLength(0);
    expect(await getSecret('media:img1')).toEqual({ dataUrl: 'data:image/jpeg;base64,AAAA' });
  });

  it('copia completa restaura todo', async () => {
    await fresh();
    await btsDoc.update((b) => ({ ...b, songs: [{ id: 's', title: 'Favorita', album: '', note: '', favorite: false, createdAt: 1 }] }));
    const file = await encryptBackup('full', await collectContent('full'), 'clave-copia');
    switchDevice();
    await fresh('otra-local');
    const r = await decryptBackup(JSON.stringify(file), 'clave-copia');
    await applyBackup(r.kind, r.content);
    expect(btsDoc.get().songs[0].title).toBe('Favorita');
  });

  it('mergeChapter agrega sin duplicar', () => {
    const base: ChapterData = { togetherSince: null, timeline: [], photos: [], letters: [], occasions: [], surprises: [], plans: [] };
    const a = mergeChapter(base, { plans: [{ id: 'x', title: 'Picnic', inspiration: '', description: '', date: null, status: 'idea' }] });
    const b = mergeChapter(a, { plans: [{ id: 'x', title: 'Picnic al río', inspiration: '', description: '', date: null, status: 'idea' }] });
    expect(b.plans).toHaveLength(1);
    expect(b.plans[0].title).toBe('Picnic al río');
  });
});

class MemoryRemote implements RemoteStore {
  meta: RemoteMeta | null = null;
  rows = new Map<string, RemoteRow>();
  async getMeta() { return this.meta; }
  async putMeta(m: RemoteMeta) { this.meta = m; }
  async listRecords() { return [...this.rows.values()].map((r) => ({ name: r.name, updatedAt: r.updatedAt })); }
  async getRecords(names: string[]) { return names.map((n) => this.rows.get(n)!).filter(Boolean); }
  async putRecords(rows: RemoteRow[]) { rows.forEach((r) => this.rows.set(r.name, r)); }
}

describe('sincronización (servidor simulado en memoria)', () => {
  it('sube cifrado, baja en otro dispositivo y exige la misma contraseña', async () => {
    const remote = new MemoryRemote();
    await fresh('clave-telefono-1');
    await btsDoc.update((b) => ({ ...b, songs: [{ id: 's', title: 'Canción guardada', album: '', note: '', favorite: true, createdAt: 1 }] }));
    const r1 = await syncNow(remote, 'sync-secreta-123');
    expect(r1.pushed).toBeGreaterThan(0);
    expect(JSON.stringify([...remote.rows.values()])).not.toContain('Canción guardada');

    switchDevice();
    await fresh('clave-telefono-2');
    await expect(syncNow(remote, 'equivocada-123')).rejects.toThrow(/no coincide/);
    // El teléfono nuevo ya guardó su propia configuración (más reciente), pero en la primera sincronización gana la nube.
    await btsDoc.update((b) => ({ ...b, songs: [] }));
    const r2 = await syncNow(remote, 'sync-secreta-123');
    expect(r2.pulled).toBeGreaterThan(0);
    expect(btsDoc.get().songs[0].title).toBe('Canción guardada');
    // A partir de ahí, un cambio local nuevo sí se sube.
    await btsDoc.update((b) => ({ ...b, songs: [...b.songs, { id: 't', title: 'Otra', album: '', note: '', favorite: false, createdAt: 2 }] }));
    const r3 = await syncNow(remote, 'sync-secreta-123');
    expect(r3.pushed).toBe(1);
    lockVault();
    expect(await unlockVault('clave-telefono-2')).toBe(true);
  });
});
