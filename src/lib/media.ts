// Imágenes: se reducen en el dispositivo y se guardan cifradas como registros "media:<id>".
import { useEffect, useState } from 'react';
import { deleteSecret, getSecret, putSecret } from './vault';
import { newId } from './store';

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const cache = new Map<string, string>();

async function loadBitmap(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* se intenta con <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fileToDataUrl(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo tiene que ser una imagen.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La imagen es demasiado grande (máx. 25 MB).');
  let bmp;
  try {
    bmp = await loadBitmap(file);
  } catch {
    throw new Error('No se pudo leer la imagen. Probá con JPG o PNG.');
  }
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador no puede procesar imágenes.');
  ctx.fillStyle = '#fffaf3';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function saveMediaData(id: string, dataUrl: string, updatedAt?: number): Promise<void> {
  await putSecret(`media:${id}`, { dataUrl }, updatedAt);
  cache.set(id, dataUrl);
}

export async function saveImageFile(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const id = newId();
  await saveMediaData(id, dataUrl);
  return id;
}

export async function getMediaData(id: string): Promise<string | null> {
  if (cache.has(id)) return cache.get(id)!;
  const rec = await getSecret<{ dataUrl: string }>(`media:${id}`);
  if (!rec) return null;
  cache.set(id, rec.dataUrl);
  return rec.dataUrl;
}

export async function deleteMedia(id: string | null | undefined): Promise<void> {
  if (!id) return;
  cache.delete(id);
  await deleteSecret(`media:${id}`);
}

export function clearMediaCache(): void {
  cache.clear();
}

/** undefined = cargando, null = no existe. */
export function useMedia(id: string | null | undefined): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(id ? cache.get(id) : null);
  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }
    let alive = true;
    setUrl(cache.get(id));
    getMediaData(id)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}
