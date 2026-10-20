// Biblioteca de historias BL (Wattpad u otras webs): solo se guardan datos y enlaces que ella carga.
import { createDoc } from './store';

export type StoryStatus = 'quiero' | 'leyendo' | 'terminada' | 'pausada';

export const STORY_STATUS: Record<StoryStatus, string> = {
  quiero: 'Quiero leer',
  leyendo: 'Leyendo',
  terminada: 'Terminada',
  pausada: 'En pausa',
};

export interface Story {
  id: string;
  title: string;
  author: string;
  link: string;
  ship: string; // pareja principal, p. ej. "Taekook"
  tags: string[];
  status: StoryStatus;
  chapter: number; // capítulo por el que va
  chapters: number; // total (0 = no sé)
  rating: number;
  favorite: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoriesData {
  stories: Story[];
}

export const storiesDoc = createDoc<StoriesData>('stories', () => ({ stories: [] }));

// Parejas que ARMY usa mucho en fanfics (nombres de ship, no contenido).
export const SHIPS = ['Taekook', 'Jikook', 'Yoonmin', 'Namjin', 'Vmin', 'Sope', 'Taejin', 'Yoonkook'];
export const STORY_TAGS = ['Romance', 'Drama', 'Comedia', 'Fluff', 'Angst', 'Universo alterno', 'Escolar', 'Fantasía', 'Omegaverse', 'Final feliz', '+18'];

/** Acepta solo https; devuelve null si no es un enlace válido. */
export function safeLink(v: string): string | null {
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export const isWattpad = (link: string) => {
  try {
    return /(^|\.)wattpad\.com$/.test(new URL(link).hostname);
  } catch {
    return false;
  }
};

export const wattpadSearchUrl = (q: string) => `https://www.wattpad.com/search/${encodeURIComponent(q.trim())}`;

export interface StoryFilters {
  q: string;
  status: StoryStatus | 'todas';
  ship: string;
  favorites: boolean;
}

export function filterStories(list: Story[], f: StoryFilters): Story[] {
  const q = f.q.trim().toLowerCase();
  return list
    .filter((s) => f.status === 'todas' || s.status === f.status)
    .filter((s) => !f.ship || s.ship.toLowerCase() === f.ship.toLowerCase())
    .filter((s) => !f.favorites || s.favorite)
    .filter((s) => !q || [s.title, s.author, s.ship, s.notes, ...s.tags].some((x) => x.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}

export function progressText(s: Story): string {
  if (s.status === 'terminada') return 'Terminada ✓';
  if (!s.chapter) return s.chapters ? `${s.chapters} capítulos` : '';
  return s.chapters ? `Cap. ${s.chapter} de ${s.chapters}` : `Cap. ${s.chapter}`;
}
