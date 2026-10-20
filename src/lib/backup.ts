// Copias de seguridad cifradas con contraseña, y "paquete del capítulo" para pasar el
// contenido romántico de un dispositivo a otro sin incluir nunca el diario personal.
import { deriveKey, fromB64, PBKDF2_ITERATIONS, randomBytes, seal, toB64, unseal, type Sealed } from './crypto';
import { btsDoc, chapterDoc, dramaDoc, personalDoc, petDoc, settingsDoc } from './docs';
import { storiesDoc } from './stories';
import { getMediaData, saveMediaData } from './media';
import { listSecretNames } from './vault';
import type { ChapterData } from './types';
import type { Doc } from './store';

export type BackupKind = 'full' | 'chapter';

export interface BackupFile {
  format: 'seoulmate-backup';
  version: 1;
  kind: BackupKind;
  createdAt: string;
  salt: string;
  iterations: number;
  payload: Sealed;
}

export interface BackupContent {
  docs: Record<string, unknown>;
  media: Record<string, string>;
}

const FULL_DOCS: Doc<any>[] = [settingsDoc, petDoc, btsDoc, dramaDoc, chapterDoc, personalDoc, storiesDoc];

export function chapterMediaIds(c: ChapterData): string[] {
  return [
    ...c.timeline.map((t) => t.imageId),
    ...c.photos.map((p) => p.imageId),
    ...c.surprises.map((s) => s.imageId),
  ].filter((x): x is string => !!x);
}

export async function collectContent(kind: BackupKind): Promise<BackupContent> {
  const docs: Record<string, unknown> = {};
  let mediaIds: string[];
  if (kind === 'full') {
    for (const d of FULL_DOCS) docs[d.name] = d.get();
    mediaIds = (await listSecretNames('media:')).map((n) => n.slice('media:'.length));
  } else {
    const c = chapterDoc.get();
    docs.chapter = c;
    mediaIds = chapterMediaIds(c);
  }
  const media: Record<string, string> = {};
  for (const id of mediaIds) {
    const data = await getMediaData(id);
    if (data) media[id] = data;
  }
  return { docs, media };
}

export async function encryptBackup(kind: BackupKind, content: BackupContent, password: string): Promise<BackupFile> {
  if (password.length < 6) throw new Error('La contraseña de la copia debe tener al menos 6 caracteres.');
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return {
    format: 'seoulmate-backup',
    version: 1,
    kind,
    createdAt: new Date().toISOString(),
    salt: toB64(salt),
    iterations: PBKDF2_ITERATIONS,
    payload: await seal(key, content),
  };
}

export async function decryptBackup(text: string, password: string): Promise<{ kind: BackupKind; content: BackupContent }> {
  let file: BackupFile;
  try {
    file = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es una copia de Seoulmate.');
  }
  if (file?.format !== 'seoulmate-backup' || !file.payload) throw new Error('El archivo no es una copia de Seoulmate.');
  const key = await deriveKey(password, fromB64(file.salt), file.iterations);
  try {
    return { kind: file.kind, content: await unseal<BackupContent>(key, file.payload) };
  } catch {
    throw new Error('Contraseña incorrecta o archivo dañado.');
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[] | undefined, keep?: (cur: T, inc: T) => T): T[] {
  const out = current.slice();
  for (const inc of incoming ?? []) {
    const i = out.findIndex((x) => x.id === inc.id);
    if (i === -1) out.push(inc);
    else out[i] = keep ? keep(out[i], inc) : inc;
  }
  return out;
}

/** Combina el capítulo importado con el actual sin perder qué cartas/sorpresas ya se abrieron. */
export function mergeChapter(cur: ChapterData, inc: Partial<ChapterData>): ChapterData {
  return {
    togetherSince: inc.togetherSince ?? cur.togetherSince,
    timeline: mergeById(cur.timeline, inc.timeline),
    photos: mergeById(cur.photos, inc.photos),
    letters: mergeById(cur.letters, inc.letters, (c, i) => ({ ...i, openedAt: c.openedAt ?? i.openedAt })),
    occasions: mergeById(cur.occasions, inc.occasions),
    surprises: mergeById(cur.surprises, inc.surprises, (c, i) => ({ ...i, openedAt: c.openedAt ?? i.openedAt })),
    plans: mergeById(cur.plans, inc.plans),
  };
}

export async function applyBackup(kind: BackupKind, content: BackupContent): Promise<void> {
  for (const [id, data] of Object.entries(content.media ?? {})) await saveMediaData(id, data);
  if (kind === 'chapter') {
    const inc = content.docs.chapter as Partial<ChapterData> | undefined;
    if (!inc) throw new Error('El paquete no contiene un capítulo.');
    await chapterDoc.replace(mergeChapter(chapterDoc.get(), inc));
    return;
  }
  for (const d of FULL_DOCS) {
    if (d.name in content.docs) await d.replace(content.docs[d.name]);
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
