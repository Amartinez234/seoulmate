// Datos de fans sobre los integrantes (sin fotos ni logos oficiales).
// El animal es el que ARMY suele asociar a cada uno; se usa como emoji en los juegos.
export interface BtsMember {
  id: string;
  name: string;
  emoji: string;
  animal: string;
}

export const MEMBERS: BtsMember[] = [
  { id: 'rm', name: 'RM', emoji: '🐨', animal: 'koala' },
  { id: 'jin', name: 'Jin', emoji: '🐹', animal: 'hámster' },
  { id: 'suga', name: 'SUGA', emoji: '🐱', animal: 'gatito' },
  { id: 'jhope', name: 'j-hope', emoji: '🐿️', animal: 'ardilla' },
  { id: 'jimin', name: 'Jimin', emoji: '🐥', animal: 'pollito' },
  { id: 'v', name: 'V', emoji: '🐯', animal: 'tigre' },
  { id: 'jk', name: 'Jung Kook', emoji: '🐰', animal: 'conejito' },
];
