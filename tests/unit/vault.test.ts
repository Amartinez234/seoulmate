import { describe, expect, it } from 'vitest';
import { idb } from '../../src/lib/db';
import { seal, unseal, deriveKey, randomBytes } from '../../src/lib/crypto';
import {
  changePassphrase, createVault, getSecret, isUnlocked, isVaultSetUp, lockVault, putSecret, unlockVault, unlockDelayMs,
} from '../../src/lib/vault';
import { btsDoc, chapterDoc, personalDoc } from '../../src/lib/docs';
import { loadAllDocs, resetAllDocs } from '../../src/lib/store';

describe('cifrado', () => {
  it('cifra y descifra; con otra clave falla', async () => {
    const salt = randomBytes(16);
    const k1 = await deriveKey('clave-uno', salt, 1000);
    const k2 = await deriveKey('clave-dos', salt, 1000);
    const s = await seal(k1, { hola: 'mundo', n: 1 });
    expect(s.ct).not.toContain('mundo');
    expect(await unseal(k1, s)).toEqual({ hola: 'mundo', n: 1 });
    await expect(unseal(k2, s)).rejects.toBeTruthy();
  });
});

describe('bóveda', () => {
  it('rechaza contraseñas cortas', async () => {
    await expect(createVault('123')).rejects.toThrow(/al menos 6/);
  });

  it('crea, bloquea, rechaza contraseña errónea y desbloquea', async () => {
    expect(await isVaultSetUp()).toBe(false);
    await createVault('nuestra-clave');
    expect(isUnlocked()).toBe(true);
    await putSecret('prueba', { texto: 'secreto íntimo' });
    const raw = JSON.stringify(await idb.get('rec:prueba'));
    expect(raw).not.toContain('secreto');
    lockVault();
    expect(isUnlocked()).toBe(false);
    await expect(getSecret('prueba')).rejects.toThrow(/bloqueada/);
    expect(await unlockVault('otra-cosa')).toBe(false);
    expect(await unlockVault('nuestra-clave')).toBe(true);
    expect(await getSecret('prueba')).toEqual({ texto: 'secreto íntimo' });
  });

  it('aplica espera progresiva tras 5 intentos fallidos', async () => {
    await createVault('nuestra-clave');
    lockVault();
    for (let i = 0; i < 5; i++) await unlockVault('mal' + i + 'xxxx');
    expect(await unlockDelayMs()).toBeGreaterThan(0);
  });

  it('cambia la contraseña conservando los datos', async () => {
    await createVault('primera-clave');
    await putSecret('x', [1, 2, 3]);
    await expect(changePassphrase('incorrecta', 'segunda-clave')).rejects.toThrow(/actual/);
    await changePassphrase('primera-clave', 'segunda-clave');
    lockVault();
    expect(await unlockVault('primera-clave')).toBe(false);
    expect(await unlockVault('segunda-clave')).toBe(true);
    expect(await getSecret('x')).toEqual([1, 2, 3]);
  });

  it('los documentos persisten y diario/capítulo se guardan por separado', async () => {
    await createVault('nuestra-clave');
    await loadAllDocs();
    await btsDoc.update((d) => ({ ...d, songs: [{ id: 's1', title: 'Mi canción', album: '', note: '', favorite: true, createdAt: 1 }] }));
    await personalDoc.update((d) => ({ ...d, diary: [{ id: 'd1', date: '2026-10-16', title: 'Hoy', body: 'privado', mood: '', createdAt: 1, updatedAt: 1 }] }));
    await chapterDoc.update((d) => ({ ...d, togetherSince: '2024-02-14' }));
    lockVault();
    resetAllDocs();
    expect(btsDoc.get().songs).toHaveLength(0);
    await unlockVault('nuestra-clave');
    await loadAllDocs();
    expect(btsDoc.get().songs[0].title).toBe('Mi canción');
    expect(personalDoc.get().diary[0].body).toBe('privado');
    expect(chapterDoc.get().togetherSince).toBe('2024-02-14');
    const keys = await idb.keys();
    expect(keys).toEqual(expect.arrayContaining(['rec:personal', 'rec:chapter', 'rec:bts']));
    expect(btsDoc.get().members).toHaveLength(7);
  });
});
