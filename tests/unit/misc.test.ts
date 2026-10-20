import { describe, expect, it } from 'vitest';
import { countdownText, daysToNextMonthiversary, isUnlocked, isValidDateKey, togetherCounter } from '../../src/lib/dates';
import { EMPTY_FILTERS, filterDramas, pickRandom, rouletteCandidates } from '../../src/lib/dramas';
import { validate } from '../../src/lib/validation';
import { phraseOfDay, PHRASES } from '../../src/lib/phrases';
import type { Drama } from '../../src/lib/types';

const now = new Date(2026, 9, 16, 12);

describe('fechas', () => {
  it('valida fechas reales', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(isValidDateKey('2024-02-29')).toBe(true);
    expect(isValidDateKey('16/10/2026')).toBe(false);
  });
  it('contador de tiempo juntos', () => {
    expect(togetherCounter('2024-02-14', now)).toEqual({ years: 2, months: 8, days: 2, totalDays: 975 });
    expect(togetherCounter('2027-01-01', now)).toBeNull();
    expect(togetherCounter(null, now)).toBeNull();
  });
  it('próximo mesiversario', () => {
    expect(daysToNextMonthiversary('2024-02-14', now)).toBe(29);
    expect(daysToNextMonthiversary('2024-01-31', now)).toBe(15);
  });
  it('desbloqueo por fecha', () => {
    expect(isUnlocked('2026-10-16', now)).toBe(true);
    expect(isUnlocked('2026-10-17', now)).toBe(false);
    expect(isUnlocked(null, now)).toBe(true);
    expect(countdownText('2026-10-17', now)).toBe('mañana');
    expect(countdownText('2026-10-20', now)).toBe('en 4 días');
  });
});

const d = (p: Partial<Drama>): Drama => ({
  id: Math.random().toString(), title: 'X', status: 'pendiente', genres: [], moods: [], rating: 0, review: '',
  characters: '', actors: '', episodeNotes: [], recommend: false, recommendNote: '', createdAt: 0, updatedAt: 0, ...p,
});

describe('dramas', () => {
  const list = [
    d({ title: 'Uno', status: 'terminado', genres: ['Romance'], rating: 5, recommend: true, moods: ['Romántica'] }),
    d({ title: 'Dos', status: 'pendiente', genres: ['Comedia'], moods: ['Con ganas de reír'] }),
    d({ title: 'Tres', status: 'en-curso', genres: ['Romance', 'Fantasía'], rating: 3, moods: ['Romántica'] }),
  ];
  it('filtra por estado, género, puntuación y búsqueda', () => {
    expect(filterDramas(list, { ...EMPTY_FILTERS, status: 'pendiente' }).map((x) => x.title)).toEqual(['Dos']);
    expect(filterDramas(list, { ...EMPTY_FILTERS, genre: 'Romance' })).toHaveLength(2);
    expect(filterDramas(list, { ...EMPTY_FILTERS, minRating: 4 }).map((x) => x.title)).toEqual(['Uno']);
    expect(filterDramas(list, { ...EMPTY_FILTERS, q: 'tre' }).map((x) => x.title)).toEqual(['Tres']);
    expect(filterDramas(list, { ...EMPTY_FILTERS, onlyRecommended: true })).toHaveLength(1);
  });
  it('la ruleta excluye terminados y respeta el ánimo', () => {
    expect(rouletteCandidates(list, 'Romántica').map((x) => x.title)).toEqual(['Tres']);
    expect(rouletteCandidates(list, '')).toHaveLength(2);
    expect(rouletteCandidates(list, 'Para llorar')).toHaveLength(0);
    expect(pickRandom([], () => 0.5)).toBeNull();
    expect(pickRandom(['a', 'b'], () => 0.99)).toBe('b');
  });
});

describe('validación y frases', () => {
  it('valida obligatorios, longitud y fechas', () => {
    const e = validate({ t: '', n: 'x'.repeat(5), f: '2026-13-01' }, {
      t: { label: 'Título', required: true }, n: { label: 'Nota', max: 3 }, f: { label: 'Fecha', date: true },
    });
    expect(Object.keys(e).sort()).toEqual(['f', 'n', 't']);
    expect(validate({ t: 'ok' }, { t: { label: 'Título', required: true } })).toEqual({});
  });
  it('frase del día estable y en rotación', () => {
    expect(phraseOfDay(now)).toBe(phraseOfDay(new Date(2026, 9, 16, 23)));
    expect(PHRASES).toContain(phraseOfDay(now));
  });
});
