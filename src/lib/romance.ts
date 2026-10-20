// Catálogo curado de K-dramas de romance (títulos reales, sinopsis propias y breves).
// No se guardan enlaces a episodios: la disponibilidad cambia por país, así que se
// ofrecen búsquedas en plataformas oficiales y en JustWatch (Argentina).
import type { Drama } from './types';
import { newId } from './store';

export interface RomancePick {
  title: string;
  titleEs: string;
  year: number;
  leads: string;
  moods: string[];
  pitch: string;
}

export const ROMANCE_PICKS: RomancePick[] = [
  { title: 'Crash Landing on You', titleEs: 'Aterrizaje de emergencia en tu corazón', year: 2019, leads: 'Hyun Bin, Son Ye-jin', moods: ['Romántica', 'Para llorar'], pitch: 'Una heredera surcoreana cae en parapente al otro lado de la frontera y un oficial norcoreano la esconde.' },
  { title: 'Goblin', titleEs: 'Goblin: el solitario ser inmortal', year: 2016, leads: 'Gong Yoo, Kim Go-eun', moods: ['Romántica', 'Para llorar'], pitch: 'Un ser inmortal busca a la novia que puede terminar su maldición, y la encuentra en una estudiante.' },
  { title: "What's Wrong with Secretary Kim", titleEs: '¿Qué le pasa a la secretaria Kim?', year: 2018, leads: 'Park Seo-joon, Park Min-young', moods: ['Romántica', 'Con ganas de reír'], pitch: 'Un CEO narcisista entra en pánico cuando su secretaria perfecta anuncia que renuncia.' },
  { title: 'Business Proposal', titleEs: 'Propuesta laboral', year: 2022, leads: 'Ahn Hyo-seop, Kim Se-jeong', moods: ['Romántica', 'Con ganas de reír'], pitch: 'Va a una cita a ciegas en lugar de su amiga y resulta que el candidato es su propio jefe.' },
  { title: 'Twenty-Five Twenty-One', titleEs: 'Veinticinco, veintiuno', year: 2022, leads: 'Kim Tae-ri, Nam Joo-hyuk', moods: ['Romántica', 'Para llorar'], pitch: 'Una esgrimista adolescente y un joven sin rumbo crecen juntos durante la crisis de 1998.' },
  { title: "It's Okay to Not Be Okay", titleEs: 'Está bien no estar bien', year: 2020, leads: 'Kim Soo-hyun, Seo Ye-ji', moods: ['Romántica', 'Para llorar'], pitch: 'Un cuidador psiquiátrico y una escritora de cuentos oscuros se sanan el uno al otro.' },
  { title: 'Hometown Cha-Cha-Cha', titleEs: 'Hometown Cha-Cha-Cha', year: 2021, leads: 'Shin Min-a, Kim Seon-ho', moods: ['Romántica', 'Acogedora'], pitch: 'Una dentista de ciudad se muda a un pueblo costero donde un vecino lo sabe hacer todo.' },
  { title: 'Descendants of the Sun', titleEs: 'Descendientes del sol', year: 2016, leads: 'Song Joong-ki, Song Hye-kyo', moods: ['Romántica', 'Aventurera'], pitch: 'Un capitán de fuerzas especiales y una cirujana se reencuentran en una misión en el extranjero.' },
  { title: 'Queen of Tears', titleEs: 'La reina de las lágrimas', year: 2024, leads: 'Kim Soo-hyun, Kim Ji-won', moods: ['Romántica', 'Para llorar'], pitch: 'Un matrimonio en plena crisis redescubre por qué se enamoró cuando todo se viene abajo.' },
  { title: 'Lovely Runner', titleEs: 'Lovely Runner', year: 2024, leads: 'Byeon Woo-seok, Kim Hye-yoon', moods: ['Romántica', 'Con ganas de reír'], pitch: 'Una fan viaja en el tiempo para salvar a su ídolo favorito antes de que sea famoso.' },
  { title: 'True Beauty', titleEs: 'True Beauty', year: 2020, leads: 'Moon Ga-young, Cha Eun-woo', moods: ['Romántica', 'Con ganas de reír'], pitch: 'Una chica que se vuelve experta en maquillaje teme que el chico más popular descubra su cara sin él.' },
  { title: 'Strong Woman Do Bong-soon', titleEs: 'Do Bong-soon, la mujer fuerte', year: 2017, leads: 'Park Bo-young, Park Hyung-sik', moods: ['Romántica', 'Con ganas de reír'], pitch: 'Una chica con fuerza sobrehumana termina siendo la guardaespaldas de un CEO excéntrico.' },
  { title: 'Reply 1988', titleEs: 'Reply 1988', year: 2015, leads: 'Lee Hye-ri, Park Bo-gum, Ryu Jun-yeol', moods: ['Acogedora', 'Para llorar'], pitch: 'Cinco familias de un mismo barrio de Seúl, amistad y primer amor a fines de los 80.' },
  { title: 'Our Beloved Summer', titleEs: 'Nuestro amado verano', year: 2021, leads: 'Choi Woo-shik, Kim Da-mi', moods: ['Romántica', 'Acogedora'], pitch: 'Dos ex que filmaron un documental en la secundaria tienen que volver a filmar otro, juntos.' },
  { title: 'Moon Lovers: Scarlet Heart Ryeo', titleEs: 'Moon Lovers', year: 2016, leads: 'IU, Lee Joon-gi', moods: ['Romántica', 'Para llorar'], pitch: 'Una joven despierta en la dinastía Goryeo, en medio de príncipes que pelean por el trono.' },
  { title: 'Hotel del Luna', titleEs: 'Hotel del Luna', year: 2019, leads: 'IU, Yeo Jin-goo', moods: ['Romántica', 'Con intriga'], pitch: 'Un gerente humano termina trabajando en un hotel para fantasmas dirigido por una dueña milenaria.' },
  { title: 'Start-Up', titleEs: 'Start-Up', year: 2020, leads: 'Bae Suzy, Nam Joo-hyuk', moods: ['Romántica', 'Aventurera'], pitch: 'Una emprendedora y un genio de la programación se cruzan en el Silicon Valley coreano.' },
  { title: 'Weightlifting Fairy Kim Bok-joo', titleEs: 'Weightlifting Fairy Kim Bok-joo', year: 2016, leads: 'Lee Sung-kyung, Nam Joo-hyuk', moods: ['Romántica', 'Acogedora'], pitch: 'Una pesista universitaria se reencuentra con un nadador que conoció de chica.' },
  { title: 'King the Land', titleEs: 'King the Land', year: 2023, leads: 'Lee Jun-ho, Im Yoon-ah', moods: ['Romántica', 'Con ganas de reír'], pitch: 'El heredero de un grupo hotelero que odia las sonrisas falsas y una empleada que siempre sonríe.' },
  { title: 'Love Next Door', titleEs: 'Love Next Door', year: 2024, leads: 'Jung Hae-in, Jung So-min', moods: ['Romántica', 'Acogedora'], pitch: 'Dos amigos de la infancia, hijos de mejores amigas, vuelven a ser vecinos de grandes.' },
];

/** Búsquedas en sitios oficiales o de consulta legal (no hay enlaces fijos a episodios). */
export function whereToWatch(title: string): Array<{ label: string; url: string }> {
  const q = encodeURIComponent(title);
  return [
    { label: 'Dónde está (JustWatch)', url: `https://www.justwatch.com/ar/buscar?q=${q}` },
    { label: 'Netflix', url: `https://www.netflix.com/search?q=${q}` },
    { label: 'Viki', url: `https://www.viki.com/search?q=${q}` },
    { label: 'Tráiler', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}` },
  ];
}

export function isInList(dramas: Drama[], title: string): boolean {
  const t = title.trim().toLowerCase();
  return dramas.some((d) => d.title.trim().toLowerCase() === t);
}

export function pickToDrama(p: RomancePick, now = Date.now()): Drama {
  return {
    id: newId(),
    title: p.title,
    status: 'pendiente',
    genres: ['Romance'],
    moods: [...p.moods],
    rating: 0,
    review: '',
    characters: '',
    actors: p.leads,
    episodeNotes: [],
    recommend: false,
    recommendNote: '',
    createdAt: now,
    updatedAt: now,
  };
}
