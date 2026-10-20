import { createDoc } from './store';
import { initialPet } from './pet';
import type { BtsData, ChapterData, DramaData, PersonalData, Settings } from './types';

export const settingsDoc = createDoc<Settings>('settings', () => ({
  nickname: '',
  autoLockMinutes: 5,
  authorPin: null,
  customPhrases: [],
  onboarded: false,
}));

export const petDoc = createDoc('pet', () => initialPet());

// Solo los nombres artísticos públicos, para elegir y ordenar. Todo lo demás lo agrega ella.
const MEMBER_NAMES = ['RM', 'Jin', 'SUGA', 'j-hope', 'Jimin', 'V', 'Jung Kook'];

export const btsDoc = createDoc<BtsData>('bts', () => ({
  songs: [],
  albums: [],
  members: MEMBER_NAMES.map((name, i) => ({ id: `m${i}`, name, note: '', favorite: false })),
  photocards: [],
  memories: [],
  lists: [],
}));

export const dramaDoc = createDoc<DramaData>('dramas', () => ({ dramas: [] }));

// Contenido romántico: documento propio, separado del diario personal.
export const chapterDoc = createDoc<ChapterData>('chapter', () => ({
  togetherSince: null,
  timeline: [],
  photos: [],
  letters: [],
  occasions: [],
  surprises: [],
  plans: [],
}));

// Diario, tareas y objetivos: documento propio, nunca se exporta con el "paquete del capítulo".
export const personalDoc = createDoc<PersonalData>('personal', () => ({ diary: [], tasks: [], goals: [] }));
