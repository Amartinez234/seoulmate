// Habitación del Cat Café y dibujos originales de cada objeto de la tienda.
import type { ReactNode } from 'react';
import { Cat, type CatMood } from './Cat';
import type { PetState } from '../lib/pet';

export interface Particle {
  id: number;
  char: string;
  left: number;
}

export function Room({
  pet,
  mood,
  speech,
  particles,
  onCatClick,
}: {
  pet: PetState;
  mood: CatMood;
  speech?: string | null;
  particles: Particle[];
  onCatClick?: () => void;
}) {
  const eq = pet.equipped;
  const catBottom = eq.bed ? '13%' : '6%';
  return (
    <div className="room" data-testid="room">
      <div className={`wall wp-${eq.wallpaper}`} />
      <svg className="window" viewBox="0 0 92 78" aria-hidden="true">
        <rect x="3" y="3" width="86" height="72" rx="10" fill={eq.wallpaper === 'pared-noche' ? '#2f2452' : '#dff0fb'} stroke="#fff" strokeWidth="5" />
        <path d="M46 3v72M3 39h86" stroke="#fff" strokeWidth="4" />
        {eq.wallpaper === 'pared-noche' ? (
          <path d="M66 14a10 10 0 1 0 8 16 8 8 0 0 1-8-16Z" fill="#f8e7a1" />
        ) : (
          <>
            <ellipse cx="24" cy="24" rx="12" ry="5" fill="#fff" />
            <ellipse cx="66" cy="56" rx="10" ry="4" fill="#fff" />
          </>
        )}
      </svg>
      {eq.decor.map((d, i) => (
        <div key={d} className={`slot slot-decor${i}`} title={d}>
          <ItemArt id={d} />
        </div>
      ))}
      <div className="floor" />
      <div className="rug" />
      {eq.bed && (
        <div className="slot slot-bed">
          <ItemArt id={eq.bed} />
        </div>
      )}
      {eq.toy && (
        <div className="slot slot-toy">
          <ItemArt id={eq.toy} />
        </div>
      )}
      <button
        type="button"
        className="catspot"
        style={{ bottom: catBottom }}
        onClick={onCatClick}
        aria-label={`Acariciar a ${pet.name || 'tu gatito'}`}
      >
        <Cat breed={pet.breed} accessory={eq.accessory} mood={mood} size={170} title={pet.name} />
      </button>
      {speech && (
        <div className="speech" role="status" data-testid="cat-speech">
          {speech}
        </div>
      )}
      <div className="particles" aria-hidden="true">
        {particles.map((p) => (
          <span key={p.id} className="particle" style={{ left: `${p.left}%` }}>
            {p.char}
          </span>
        ))}
      </div>
    </div>
  );
}

const S = ({ children, vb = '0 0 64 64' }: { children: ReactNode; vb?: string }) => (
  <svg viewBox={vb} aria-hidden="true">
    {children}
  </svg>
);

export function ItemArt({ id }: { id: string }) {
  switch (id) {
    // accesorios (miniatura)
    case 'lazo-rosa':
      return (
        <S>
          <path d="M32 32 L10 18 L10 46 Z M32 32 L54 18 L54 46 Z" fill="#e8a6bf" stroke="#c97f9c" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="7" fill="#f6c9d8" stroke="#c97f9c" strokeWidth="2.5" />
        </S>
      );
    case 'flor-cerezo':
      return (
        <S>
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="32" cy="18" rx="9" ry="13" fill="#f9d3e0" stroke="#e8a6bf" strokeWidth="1.5" transform={`rotate(${r} 32 32)`} />
          ))}
          <circle cx="32" cy="32" r="5" fill="#f8e7a1" />
        </S>
      );
    case 'bufanda-lavanda':
      return (
        <S>
          <path d="M8 22 Q32 34 56 22 L56 34 Q32 46 8 34 Z" fill="#b9a7e8" stroke="#8e7cc3" strokeWidth="2.5" />
          <path d="M40 38 l4 20 l9 -3 l-4 -19" fill="#b9a7e8" stroke="#8e7cc3" strokeWidth="2.5" strokeLinejoin="round" />
        </S>
      );
    case 'gafas-corazon':
      return (
        <S>
          <g fill="rgba(232,166,191,0.6)" stroke="#c97f9c" strokeWidth="3" strokeLinejoin="round">
            <path d="M18 44 c-12 -7 -15 -14 -13 -19 2 -5 9 -6 13 -1 4 -5 11 -4 13 1 2 5 -1 12 -13 19Z" />
            <path d="M46 44 c-12 -7 -15 -14 -13 -19 2 -5 9 -6 13 -1 4 -5 11 -4 13 1 2 5 -1 12 -13 19Z" />
          </g>
        </S>
      );
    case 'auriculares':
      return (
        <S>
          <path d="M12 40 C 12 6, 52 6, 52 40" stroke="#c9cbd3" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="4" y="32" width="14" height="22" rx="6" fill="#8e7cc3" />
          <rect x="46" y="32" width="14" height="22" rx="6" fill="#8e7cc3" />
        </S>
      );
    case 'corona-estrellas':
      return (
        <S>
          <path d="M8 48 L6 16 L20 30 L32 10 L44 30 L58 16 L56 48 Z" fill="#f8e7a1" stroke="#d8b84e" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="32" cy="38" r="5" fill="#e8a6bf" />
        </S>
      );
    // juguetes
    case 'ovillo':
      return (
        <S>
          <circle cx="30" cy="34" r="20" fill="#e8b4c8" stroke="#c97f9c" strokeWidth="2.5" />
          <path d="M14 26 q16 8 32 -6 M12 38 q18 6 36 -10 M20 50 q12 -14 26 -26" stroke="#c97f9c" strokeWidth="2" fill="none" />
          <path d="M48 44 q10 6 12 16" stroke="#c97f9c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'raton':
      return (
        <S>
          <ellipse cx="30" cy="40" rx="20" ry="13" fill="#c9cbd3" stroke="#9fa3b2" strokeWidth="2.5" />
          <circle cx="16" cy="28" r="7" fill="#e8b4c8" stroke="#9fa3b2" strokeWidth="2" />
          <circle cx="16" cy="40" r="2" fill="#3d3350" />
          <path d="M50 42 q10 0 10 -12" stroke="#9fa3b2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </S>
      );
    case 'varita-pluma':
      return (
        <S>
          <path d="M10 58 L40 18" stroke="#c9a77a" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 18 q10 -14 18 -10 q-2 12 -18 10Z" fill="#b9a7e8" stroke="#8e7cc3" strokeWidth="2" />
          <path d="M40 18 q2 -10 10 -14" stroke="#8e7cc3" strokeWidth="1.5" fill="none" />
        </S>
      );
    case 'pelota-estrella':
      return (
        <S>
          <circle cx="32" cy="34" r="22" fill="#fff4c7" stroke="#d8b84e" strokeWidth="2.5" />
          <path d="M32 20 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#f8d76a" />
        </S>
      );
    // camas
    case 'cojin-nube':
      return (
        <S vb="0 0 190 70">
          <path d="M20 58 C 4 58, 4 30, 26 32 C 30 12, 62 8, 74 24 C 90 6, 124 8, 130 26 C 152 14, 184 30, 170 58 Z" fill="#fff" stroke="#c9cbd3" strokeWidth="3" />
          <path d="M30 50 h130" stroke="#ece6fa" strokeWidth="4" strokeLinecap="round" />
        </S>
      );
    case 'cesta':
      return (
        <S vb="0 0 190 70">
          <path d="M10 28 h170 l-14 38 H24 Z" fill="#e7c79c" stroke="#c39a66" strokeWidth="3" strokeLinejoin="round" />
          <path d="M14 38 h162 M18 48 h154 M22 58 h146" stroke="#c39a66" strokeWidth="2" />
          <ellipse cx="95" cy="28" rx="80" ry="8" fill="#f8e3eb" stroke="#c39a66" strokeWidth="2.5" />
        </S>
      );
    case 'cama-luna':
      return (
        <S vb="0 0 190 70">
          <path d="M8 40 Q95 90 182 40 Q160 66 95 66 Q30 66 8 40Z" fill="#f8e7a1" stroke="#d8b84e" strokeWidth="3" />
          <ellipse cx="95" cy="44" rx="72" ry="10" fill="#ece6fa" stroke="#b9a7e8" strokeWidth="2" />
          <circle cx="40" cy="52" r="3" fill="#fff" />
          <circle cx="150" cy="52" r="3" fill="#fff" />
        </S>
      );
    // decoraciones
    case 'planta':
      return (
        <S>
          <path d="M20 44 h24 l-4 16 H24 Z" fill="#e8b4c8" stroke="#c97f9c" strokeWidth="2" />
          <path d="M32 44 V22 M32 32 q-14 -2 -16 -14 q14 0 16 14 M32 26 q12 -2 14 -14 q-12 0 -14 14" fill="#a8d5ba" stroke="#6a9f86" strokeWidth="2" />
        </S>
      );
    case 'cuadro-estrellas':
      return (
        <S>
          <rect x="8" y="10" width="48" height="44" rx="4" fill="#5e4b8b" stroke="#f8e7a1" strokeWidth="4" />
          <path d="M22 22 l2 5 5 1 -5 2 -2 5 -2 -5 -5 -2 5 -1z M42 34 l2 4 4 1 -4 2 -2 4 -2 -4 -4 -2 4 -1z" fill="#f8e7a1" />
          <circle cx="40" cy="20" r="1.5" fill="#fff" />
          <circle cx="20" cy="44" r="1.5" fill="#fff" />
        </S>
      );
    case 'guirnalda':
      return (
        <S>
          <path d="M2 14 Q32 40 62 14" stroke="#9fa3b2" strokeWidth="1.6" fill="none" />
          {[
            [10, 22, '#f8e7a1'],
            [22, 29, '#e8b4c8'],
            [32, 31, '#b9a7e8'],
            [42, 29, '#f8e7a1'],
            [54, 22, '#e8b4c8'],
          ].map(([x, y, c]) => (
            <ellipse key={x as number} cx={x as number} cy={(y as number) + 5} rx="4" ry="5.5" fill={c as string} />
          ))}
        </S>
      );
    case 'estante':
      return (
        <S>
          <rect x="6" y="40" width="52" height="5" rx="2" fill="#c39a66" />
          <rect x="12" y="20" width="8" height="20" rx="1" fill="#b9a7e8" />
          <rect x="21" y="24" width="7" height="16" rx="1" fill="#e8b4c8" />
          <rect x="29" y="18" width="9" height="22" rx="1" fill="#8e7cc3" />
          <circle cx="48" cy="32" r="7" fill="#f8e7a1" stroke="#d8b84e" strokeWidth="2" />
        </S>
      );
    case 'lampara-luna':
      return (
        <S>
          <path d="M40 8a22 22 0 1 0 14 38 18 18 0 0 1-14-38Z" fill="#f8e7a1" stroke="#d8b84e" strokeWidth="2.5" />
          <path d="M30 54 v6 M22 60 h16" stroke="#c9cbd3" strokeWidth="3" strokeLinecap="round" />
        </S>
      );
    case 'cerezo':
      return (
        <S>
          <path d="M22 50 h20 l-3 12 H25 Z" fill="#c9cbd3" stroke="#9fa3b2" strokeWidth="2" />
          <path d="M32 50 V30 M32 38 l-8 -8 M32 34 l9 -9" stroke="#8a6a55" strokeWidth="3" strokeLinecap="round" />
          <circle cx="22" cy="24" r="10" fill="#f6c9d8" />
          <circle cx="40" cy="20" r="11" fill="#f9d3e0" />
          <circle cx="32" cy="14" r="9" fill="#f3b8cc" />
        </S>
      );
    default:
      if (id.startsWith('pared-')) return <div className={`wp-${id}`} style={{ width: '100%', height: '100%', borderRadius: 12 }} />;
      return null;
  }
}
