// Datos públicos de BTS para los juegos: títulos, años y datos de fans. Sin letras de canciones.
// Fuentes: Wikipedia (discografía y páginas de cada integrante), kprofiles, BTS Fandom wiki.

export interface Album {
  title: string;
  year: number;
}

// Un álbum por año para que el orden nunca sea ambiguo.
export const ALBUMS: Album[] = [
  { title: '2 Cool 4 Skool', year: 2013 },
  { title: 'Dark & Wild', year: 2014 },
  { title: 'The Most Beautiful Moment in Life, Pt. 1', year: 2015 },
  { title: 'Wings', year: 2016 },
  { title: 'Love Yourself: Her', year: 2017 },
  { title: 'Love Yourself: Answer', year: 2018 },
  { title: 'Map of the Soul: Persona', year: 2019 },
  { title: 'Map of the Soul: 7', year: 2020 },
  { title: 'Proof', year: 2022 },
  { title: 'Arirang', year: 2026 },
];

// Títulos de canciones (solo el nombre) para "Adiviná la canción".
export const SONG_TITLES = [
  'Dynamite', 'Butter', 'Spring Day', 'Fake Love', 'DNA', 'Idol', 'Boy With Luv', 'Fire', 'Dope', 'Mic Drop',
  'Life Goes On', 'Permission to Dance', 'Yet To Come', 'Run', 'Save Me', 'Not Today', 'Black Swan', 'ON',
  'Euphoria', 'Magic Shop', 'Swim', 'Blood Sweat & Tears', 'Danger', 'War of Hormone', 'Seven', 'Like Crazy',
];

/** Pistas para "¿Quién es?": cada una describe a un solo integrante. */
export const MEMBER_CLUES: Array<{ member: string; clue: string }> = [
  { member: 'RM', clue: 'Es el líder del grupo.' },
  { member: 'RM', clue: 'Dio el discurso de BTS en la ONU en 2018.' },
  { member: 'RM', clue: 'Sacó los álbumes "Indigo" y "Right Place, Wrong Person".' },
  { member: 'RM', clue: 'Creó a KOYA, el koala de BT21.' },
  { member: 'RM', clue: 'Nació el 12 de septiembre de 1994.' },
  { member: 'Jin', clue: 'Es el mayor del grupo.' },
  { member: 'Jin', clue: 'Le dicen "Worldwide Handsome".' },
  { member: 'Jin', clue: 'Cantó "The Astronaut" con Coldplay en Buenos Aires.' },
  { member: 'Jin', clue: 'Creó a RJ, la alpaca de BT21.' },
  { member: 'Jin', clue: 'Fue el primero en hacer el servicio militar.' },
  { member: 'SUGA', clue: 'Lanzó música solista como Agust D.' },
  { member: 'SUGA', clue: 'Sacó el álbum "D-DAY".' },
  { member: 'SUGA', clue: 'Creó a SHOOKY, la galletita de BT21.' },
  { member: 'SUGA', clue: 'Nació el 9 de marzo de 1993.' },
  { member: 'j-hope', clue: 'Le dicen "el sol de BTS".' },
  { member: 'j-hope', clue: 'Encabezó Lollapalooza en 2022.' },
  { member: 'j-hope', clue: 'Su álbum solista es "Jack In The Box".' },
  { member: 'j-hope', clue: 'Creó a MANG, el de la máscara de BT21.' },
  { member: 'Jimin', clue: 'Le dicen "Mochi".' },
  { member: 'Jimin', clue: 'Llegó al #1 del Hot 100 con "Like Crazy".' },
  { member: 'Jimin', clue: 'Sacó el álbum "Muse".' },
  { member: 'Jimin', clue: 'Creó a CHIMMY, el cachorrito de BT21.' },
  { member: 'Jimin', clue: 'Nació el 13 de octubre de 1995.' },
  { member: 'V', clue: 'Inventó la palabra "Borahae" (te quiero en morado).' },
  { member: 'V', clue: 'Su EP debut se llama "Layover".' },
  { member: 'V', clue: 'Creó a TATA, el del corazón de BT21.' },
  { member: 'V', clue: 'Nació el 30 de diciembre de 1995.' },
  { member: 'Jung Kook', clue: 'Es el menor: el "Golden Maknae".' },
  { member: 'Jung Kook', clue: 'Cantó "Dreamers" en el Mundial de Qatar 2022.' },
  { member: 'Jung Kook', clue: 'Su primer álbum solista se llama "Golden".' },
  { member: 'Jung Kook', clue: 'Creó a COOKY, el conejito de BT21.' },
  { member: 'Jung Kook', clue: 'Inventó "Apobangpo".' },
];

// Palabras para la sopa de letras (sin espacios ni guiones).
export const WORDSEARCH_WORDS = ['JIN', 'SUGA', 'JHOPE', 'JIMIN', 'JUNGKOOK', 'TAEHYUNG', 'NAMJOON', 'ARMY', 'BORAHAE', 'BTS'];
