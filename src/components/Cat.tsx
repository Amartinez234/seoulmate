// Gatito original en SVG, con variantes de pelaje, accesorios y reacciones.
import type { Breed, Reaction } from '../lib/pet';
import './cat.css';

const PALETTES: Record<Breed, { body: string; line: string; accent: string; light?: string; stripes?: string }> = {
  crema: { body: '#fff4e2', line: '#d9bf9c', accent: '#f6c9d8' },
  gris: { body: '#dcdee6', line: '#9fa3b2', accent: '#f3c3d3', stripes: '#b4b8c6' },
  esmoquin: { body: '#4b4459', line: '#2f2a3a', accent: '#f3b8cc', light: '#fffaf3' },
  naranja: { body: '#f8c995', line: '#d99a5d', accent: '#f6b9c9', stripes: '#e7a065' },
};

export type CatMood = Reaction | 'idle' | 'sleepy';

export function Cat({
  breed,
  accessory,
  mood = 'idle',
  size = 180,
  title,
}: {
  breed: Breed;
  accessory?: string | null;
  mood?: CatMood;
  size?: number;
  title?: string;
}) {
  const p = PALETTES[breed];
  const dark = breed === 'esmoquin';
  const eyeColor = dark ? '#f8e7a1' : '#3d3350';
  const happyEyes = mood === 'pet' || mood === 'gift';
  const sleepyEyes = mood === 'sleepy' || mood === 'tired' || mood === 'full';
  return (
    <svg
      className={`cat cat-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? 'Gatito'}
      data-mood={mood}
    >
      <ellipse cx="100" cy="190" rx="58" ry="7" fill="rgba(94,75,139,0.12)" />
      <g className="cat-tail">
        <path d="M140 168 C 178 172, 190 138, 170 116" stroke={p.line} strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M140 168 C 178 172, 190 138, 170 116" stroke={p.body} strokeWidth="12" fill="none" strokeLinecap="round" />
      </g>
      <g className="cat-body">
        <ellipse cx="100" cy="152" rx="52" ry="36" fill={p.body} stroke={p.line} strokeWidth="2.5" />
        {p.light && <ellipse cx="100" cy="156" rx="24" ry="24" fill={p.light} />}
        <ellipse cx="80" cy="184" rx="14" ry="8" fill={p.light ?? p.body} stroke={p.line} strokeWidth="2.5" />
        <ellipse cx="120" cy="184" rx="14" ry="8" fill={p.light ?? p.body} stroke={p.line} strokeWidth="2.5" />
      </g>
      <g className="cat-head">
        <path d="M58 76 L60 30 L92 56 Z" fill={p.body} stroke={p.line} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M142 76 L140 30 L108 56 Z" fill={p.body} stroke={p.line} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M64 64 L65 42 L82 56 Z" fill={p.accent} />
        <path d="M136 64 L135 42 L118 56 Z" fill={p.accent} />
        <ellipse cx="100" cy="94" rx="50" ry="42" fill={p.body} stroke={p.line} strokeWidth="2.5" />
        {p.stripes && <path d="M90 56 l2 11 M100 53 v13 M110 56 l-2 11" stroke={p.stripes} strokeWidth="4" strokeLinecap="round" />}
        {p.light && <ellipse cx="100" cy="112" rx="22" ry="15" fill={p.light} />}
        <g className={happyEyes || sleepyEyes ? '' : 'cat-eyes'}>
          {happyEyes ? (
            <>
              <path d="M74 97 q8 -10 16 0" stroke={eyeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M110 97 q8 -10 16 0" stroke={eyeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : sleepyEyes ? (
            <>
              <path d="M74 96 q8 6 16 0" stroke={eyeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M110 96 q8 6 16 0" stroke={eyeColor} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="82" cy="95" rx="7" ry="8.5" fill={eyeColor} />
              <ellipse cx="118" cy="95" rx="7" ry="8.5" fill={eyeColor} />
              <circle cx="84.5" cy="91.5" r="2.6" fill="#fff" />
              <circle cx="120.5" cy="91.5" r="2.6" fill="#fff" />
            </>
          )}
        </g>
        <ellipse cx="68" cy="110" rx="9" ry="5" fill={p.accent} opacity="0.75" />
        <ellipse cx="132" cy="110" rx="9" ry="5" fill={p.accent} opacity="0.75" />
        <path d="M95.5 104 h9 l-4.5 5 z" fill="#e48aa8" />
        {mood === 'eat' ? (
          <ellipse cx="100" cy="116" rx="6" ry="5" fill="#c46b8a" />
        ) : (
          <path d="M100 109 q-5 7 -11 2 M100 109 q5 7 11 2" stroke={dark ? '#fffaf3' : '#5e4b8b'} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        )}
        <path d="M56 104 h-16 M57 111 l-15 4 M144 104 h16 M143 111 l15 4" stroke={dark ? '#9a92ab' : p.line} strokeWidth="1.6" strokeLinecap="round" />
      </g>
      {accessory && <Accessory id={accessory} />}
    </svg>
  );
}

function Accessory({ id }: { id: string }) {
  switch (id) {
    case 'lazo-rosa':
      return (
        <g transform="translate(128 52) rotate(18)">
          <path d="M0 0 L-16 -10 L-16 10 Z M0 0 L16 -10 L16 10 Z" fill="#e8a6bf" stroke="#c97f9c" strokeWidth="1.6" strokeLinejoin="round" />
          <circle r="5" fill="#f6c9d8" stroke="#c97f9c" strokeWidth="1.6" />
        </g>
      );
    case 'flor-cerezo':
      return (
        <g transform="translate(70 56)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-8" rx="6" ry="8.5" fill="#f9d3e0" stroke="#e8a6bf" strokeWidth="1.2" transform={`rotate(${r})`} />
          ))}
          <circle r="3.5" fill="#f8e7a1" />
        </g>
      );
    case 'bufanda-lavanda':
      return (
        <g>
          <path d="M60 124 Q100 142 140 124 L140 136 Q100 154 60 136 Z" fill="#b9a7e8" stroke="#8e7cc3" strokeWidth="2" />
          <path d="M118 138 l6 26 l12 -4 l-6 -24" fill="#b9a7e8" stroke="#8e7cc3" strokeWidth="2" strokeLinejoin="round" />
          <path d="M70 131 h4 M84 135 h4 M98 137 h4 M112 135 h4 M126 131 h4" stroke="#ece6fa" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'gafas-corazon':
      return (
        <g fill="rgba(232,166,191,0.55)" stroke="#c97f9c" strokeWidth="2.4" strokeLinejoin="round">
          <path d="M82 108 c-12 -7 -16 -13 -14 -18 2 -5 9 -6 14 -1 5 -5 12 -4 14 1 2 5 -2 11 -14 18Z" />
          <path d="M118 108 c-12 -7 -16 -13 -14 -18 2 -5 9 -6 14 -1 5 -5 12 -4 14 1 2 5 -2 11 -14 18Z" />
          <path d="M96 93 q4 -3 8 0" fill="none" />
        </g>
      );
    case 'auriculares':
      return (
        <g>
          <path d="M54 92 C 54 40, 146 40, 146 92" stroke="#c9cbd3" strokeWidth="7" fill="none" strokeLinecap="round" />
          <rect x="44" y="82" width="16" height="28" rx="7" fill="#8e7cc3" stroke="#5e4b8b" strokeWidth="2" />
          <rect x="140" y="82" width="16" height="28" rx="7" fill="#8e7cc3" stroke="#5e4b8b" strokeWidth="2" />
        </g>
      );
    case 'corona-estrellas':
      return (
        <g transform="translate(100 46)">
          <path d="M-24 10 L-26 -12 L-13 -2 L0 -18 L13 -2 L26 -12 L24 10 Z" fill="#f8e7a1" stroke="#d8b84e" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="0" cy="2" r="3.5" fill="#e8a6bf" />
          <circle cx="-14" cy="5" r="2.5" fill="#b9a7e8" />
          <circle cx="14" cy="5" r="2.5" fill="#b9a7e8" />
        </g>
      );
    default:
      return null;
  }
}
