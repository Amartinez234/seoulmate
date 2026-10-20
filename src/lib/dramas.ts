import type { Drama, DramaStatus } from './types';

export const STATUS_LABEL: Record<DramaStatus, string> = {
  pendiente: 'Pendiente',
  'en-curso': 'En curso',
  terminado: 'Terminado',
};

export const GENRES = [
  'Romance',
  'Comedia',
  'Melodrama',
  'Fantasía',
  'Histórico',
  'Misterio',
  'Thriller',
  'Acción',
  'Médico',
  'Escolar',
  'Cotidiano',
  'Sobrenatural',
];

export const MOODS = ['Romántica', 'Con ganas de reír', 'Para llorar', 'Con intriga', 'Acogedora', 'Aventurera'];

export interface DramaFilters {
  q: string;
  status: DramaStatus | 'todos';
  genre: string;
  minRating: number;
  onlyRecommended: boolean;
}

export const EMPTY_FILTERS: DramaFilters = { q: '', status: 'todos', genre: '', minRating: 0, onlyRecommended: false };

export function filterDramas(list: Drama[], f: DramaFilters): Drama[] {
  const q = f.q.trim().toLowerCase();
  return list
    .filter((d) => f.status === 'todos' || d.status === f.status)
    .filter((d) => !f.genre || d.genres.includes(f.genre))
    .filter((d) => d.rating >= f.minRating)
    .filter((d) => !f.onlyRecommended || d.recommend)
    .filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.actors.toLowerCase().includes(q) ||
        d.characters.toLowerCase().includes(q),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Candidatos para la ruleta: lo que todavía no terminó, filtrado por estado de ánimo. */
export function rouletteCandidates(list: Drama[], mood: string): Drama[] {
  return list.filter((d) => d.status !== 'terminado' && (!mood || d.moods.includes(mood)));
}

export function pickRandom<T>(items: T[], rng: () => number = Math.random): T | null {
  if (!items.length) return null;
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}
