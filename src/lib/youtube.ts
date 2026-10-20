// Enlaces de YouTube / YouTube Music: se reproducen con el reproductor oficial incrustado de YouTube.
// YouTube Music no ofrece una API pública para leer la biblioteca de una cuenta, así que cada canción
// guarda el enlace que ella copia desde la app de YouTube Music ("Compartir → Copiar vínculo").

export interface YtRef {
  videoId: string | null;
  listId: string | null;
}

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'];

export function parseYouTube(input: string): YtRef | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!HOSTS.includes(url.hostname.toLowerCase())) return null;
  let videoId: string | null = null;
  if (url.hostname === 'youtu.be') videoId = url.pathname.slice(1).split('/')[0];
  else if (url.pathname === '/watch') videoId = url.searchParams.get('v');
  else {
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
    if (m) videoId = m[1];
  }
  if (videoId && !ID_RE.test(videoId)) videoId = null;
  const list = url.searchParams.get('list');
  const listId = list && /^[A-Za-z0-9_-]{10,64}$/.test(list) ? list : null;
  if (!videoId && !listId) return null;
  return { videoId, listId };
}

export function isYouTubeLink(input: string): boolean {
  return parseYouTube(input) !== null;
}

/** URL del reproductor incrustado (dominio sin cookies de seguimiento). */
export function embedUrl(ref: YtRef, origin?: string): string {
  const p = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', enablejsapi: '1' });
  if (origin && /^https?:/.test(origin)) p.set('origin', origin);
  if (ref.videoId) {
    if (ref.listId) p.set('list', ref.listId);
    return `https://www.youtube-nocookie.com/embed/${ref.videoId}?${p}`;
  }
  p.set('list', ref.listId!);
  return `https://www.youtube-nocookie.com/embed/videoseries?${p}`;
}

export function musicSearchUrl(query: string): string {
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

export function openInMusicUrl(ref: YtRef): string {
  if (ref.videoId) return `https://music.youtube.com/watch?v=${ref.videoId}${ref.listId ? `&list=${ref.listId}` : ''}`;
  return `https://music.youtube.com/playlist?list=${ref.listId}`;
}
