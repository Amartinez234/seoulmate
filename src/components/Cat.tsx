// Gatito original en SVG, con variantes de pelaje, accesorios y reacciones.
import { useId } from 'react';
import type { Breed, Reaction } from '../lib/pet';
import './cat.css';

const PALETTES: Record<Breed, { body: string; line: string; accent: string; light?: string; stripes?: string }> = {
  crema: { body: '#fff4e2', line: '#d9bf9c', accent: '#f6c9d8' },
  gris: { body: '#dcdee6', line: '#9fa3b2', accent: '#f3c3d3', stripes: '#b4b8c6' },
  esmoquin: { body: '#4b4459', line: '#2f2a3a', accent: '#f3b8cc', light: '#fffaf3' },
  naranja: { body: '#f8c995', line: '#d99a5d', accent: '#f6b9c9', stripes: '#e7a065' },
};

export type CatMood = Reaction | 'idle' | 'sleepy' | 'listen' | 'speak';

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
  const uid = useId().replace(/:/g, '');
  const fur = `fur${uid}`;
  const ear = `ear${uid}`;
  const shine = `shine${uid}`;
  const dark = breed === 'esmoquin';
  const eyeColor = dark ? '#3b2f52' : '#3d3350';
  const iris = dark ? '#f2d77e' : '#6d58a8';
  const happyEyes = mood === 'pet' || mood === 'gift' || mood === 'speak';
  const sleepyEyes = mood === 'sleepy' || mood === 'tired' || mood === 'full';
  const openMouth = mood === 'eat' || mood === 'speak' || mood === 'play';
  const mouthColor = dark ? '#fffaf3' : '#6b5398';
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
      <defs>
        <radialGradient id={fur} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor={dark ? '#7a7090' : '#ffffff'} stopOpacity={dark ? 1 : 0.85} />
          <stop offset="55%" stopColor={p.body} />
          <stop offset="100%" stopColor={p.line} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={ear} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.accent} />
          <stop offset="100%" stopColor="#fbe3ec" />
        </linearGradient>
        <radialGradient id={shine} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={iris} />
          <stop offset="100%" stopColor={eyeColor} />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="192" rx="54" ry="6" fill="rgba(94,75,139,0.14)" />
      <g className="cat-tail">
        <path d="M138 172 C 182 176, 192 136, 166 112" stroke={p.line} strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M138 172 C 182 176, 192 136, 166 112" stroke={p.body} strokeWidth="13" fill="none" strokeLinecap="round" />
        {p.stripes && <path d="M176 150 l9 2 M172 130 l9 -2" stroke={p.stripes} strokeWidth="4" strokeLinecap="round" />}
      </g>
      <g className="cat-body">
        <path d="M58 186 C 50 140, 74 126, 100 126 C 126 126, 150 140, 142 186 Z" fill={`url(#${fur})`} stroke={p.line} strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="100" cy="162" rx="22" ry="22" fill={p.light ?? '#ffffff'} opacity={dark ? 1 : 0.55} />
        <g className="cat-paws">
          <ellipse cx="82" cy="186" rx="13" ry="8.5" fill={p.light ?? p.body} stroke={p.line} strokeWidth="2.5" />
          <ellipse cx="118" cy="186" rx="13" ry="8.5" fill={p.light ?? p.body} stroke={p.line} strokeWidth="2.5" />
          <path d="M78 183 v4 M83 182 v5 M88 183 v4 M114 183 v4 M119 182 v5 M124 183 v4" stroke={p.line} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>
      <g className="cat-head">
        <g className="cat-ears">
          <path d="M44 78 C 40 50, 46 28, 56 22 C 70 30, 84 42, 92 54 Z" fill={`url(#${fur})`} stroke={p.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M156 78 C 160 50, 154 28, 144 22 C 130 30, 116 42, 108 54 Z" fill={`url(#${fur})`} stroke={p.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M53 66 C 51 50, 54 38, 58 34 C 67 40, 76 48, 81 56 Z" fill={`url(#${ear})`} />
          <path d="M147 66 C 149 50, 146 38, 142 34 C 133 40, 124 48, 119 56 Z" fill={`url(#${ear})`} />
        </g>
        <path
          d="M100 46 C 146 46, 166 74, 162 104 C 158 134, 132 142, 100 142 C 68 142, 42 134, 38 104 C 34 74, 54 46, 100 46 Z"
          fill={`url(#${fur})`}
          stroke={p.line}
          strokeWidth="2.5"
        />
        <path d="M92 48 q4 -8 8 -2 q4 -8 8 0" fill={p.body} stroke={p.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {p.stripes && <path d="M88 54 l3 12 M100 51 v14 M112 54 l-3 12 M44 98 h10 M42 108 h9 M156 98 h-10 M158 108 h-9" stroke={p.stripes} strokeWidth="4" strokeLinecap="round" />}
        {p.light && <path d="M100 96 C 80 96, 70 112, 74 126 C 84 138, 116 138, 126 126 C 130 112, 120 96, 100 96 Z" fill={p.light} />}
        <g className={happyEyes || sleepyEyes ? '' : 'cat-eyes'}>
          {happyEyes ? (
            <>
              <path d="M66 100 q11 -13 22 0" stroke={dark ? "#f6e9c8" : eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M112 100 q11 -13 22 0" stroke={dark ? "#f6e9c8" : eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          ) : sleepyEyes ? (
            <>
              <path d="M66 100 q11 8 22 0" stroke={dark ? "#f6e9c8" : eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M112 100 q11 8 22 0" stroke={dark ? "#f6e9c8" : eyeColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {dark && <ellipse cx="77" cy="98" rx="13.6" ry="15.6" fill="#fffaf3" />}
              {dark && <ellipse cx="123" cy="98" rx="13.6" ry="15.6" fill="#fffaf3" />}
              <ellipse cx="77" cy="98" rx="12" ry="14" fill={`url(#${shine})`} />
              <ellipse cx="123" cy="98" rx="12" ry="14" fill={`url(#${shine})`} />
              <ellipse cx="77" cy="100" rx="6.5" ry="8" fill={eyeColor} />
              <ellipse cx="123" cy="100" rx="6.5" ry="8" fill={eyeColor} />
              <circle cx="81.5" cy="91.5" r="4.6" fill="#fff" />
              <circle cx="127.5" cy="91.5" r="4.6" fill="#fff" />
              <circle cx="72" cy="105" r="2.2" fill="#fff" opacity="0.9" />
              <circle cx="118" cy="105" r="2.2" fill="#fff" opacity="0.9" />
              <path d="M84 102 l2 -2 l2 2 l-2 2 z M130 102 l2 -2 l2 2 l-2 2 z" fill="#fff" opacity="0.8" />
            </>
          )}
        </g>
        <ellipse cx="60" cy="118" rx="11" ry="6.5" fill={p.accent} opacity="0.7" />
        <ellipse cx="140" cy="118" rx="11" ry="6.5" fill={p.accent} opacity="0.7" />
        <path d="M95 113 q5 -3 10 0 q-1 4 -5 5.5 q-4 -1.5 -5 -5.5 z" fill="#ec8fb0" />
        {openMouth ? (
          <g className="cat-mouth">
            <path d="M92 121 q8 13 16 0 z" fill="#c4607f" stroke={mouthColor} strokeWidth="2" strokeLinejoin="round" />
            <ellipse cx="100" cy="127" rx="4" ry="2.4" fill="#f4a3bd" />
          </g>
        ) : (
          <path d="M100 118 q-4 7 -10 3 M100 118 q4 7 10 3" stroke={mouthColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        )}
        <path d="M50 112 h-18 M51 119 l-17 5 M150 112 h18 M149 119 l17 5" stroke={dark ? '#9a92ab' : p.line} strokeWidth="1.6" strokeLinecap="round" />
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
