import { describe, expect, it } from 'vitest';
import { isInList, pickToDrama, ROMANCE_PICKS, whereToWatch } from '../../src/lib/romance';

describe('ideas de romance', () => {
  it('tiene títulos únicos y completos', () => {
    const titles = ROMANCE_PICKS.map((p) => p.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
    for (const p of ROMANCE_PICKS) {
      expect(p.leads.length).toBeGreaterThan(3);
      expect(p.moods).toContain(p.moods[0]);
      expect(p.year).toBeGreaterThan(2000);
    }
  });
  it('convierte una idea en drama pendiente de romance', () => {
    const d = pickToDrama(ROMANCE_PICKS[0], 1000);
    expect(d).toMatchObject({ title: ROMANCE_PICKS[0].title, status: 'pendiente', genres: ['Romance'], rating: 0, createdAt: 1000 });
    expect(isInList([d], ' crash landing on YOU ')).toBe(true);
    expect(isInList([d], 'Goblin')).toBe(false);
  });
  it('solo enlaza a búsquedas https y codifica el título', () => {
    for (const w of whereToWatch("What's Wrong & Co")) {
      expect(w.url.startsWith('https://')).toBe(true);
      expect(w.url).not.toContain(' ');
      expect(w.url).not.toContain('&Co');
    }
  });
});
