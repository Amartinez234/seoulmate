// Ilustraciones decorativas originales: flor de cerezo, estrella, corazón y gatito para estados vacíos.
import type { CSSProperties } from 'react';

export function Blossom({ size = 22, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={style} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <path
          key={r}
          d="M20 20c-5-3-7-9-4-12.5 1.5-1.8 3-1 4 .4 1-1.4 2.5-2.2 4-.4 3 3.5 1 9.5-4 12.5Z"
          fill="#f6c9d8"
          stroke="#e8a6bf"
          strokeWidth="0.8"
          transform={`rotate(${r} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3" fill="#f8e7a1" />
    </svg>
  );
}

export function Star4({ size = 16, color = '#f8e7a1', style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={style} aria-hidden="true">
      <path d="M10 1c.6 4.7 2.4 6.6 9 9-6.6 2.4-8.4 4.3-9 9-.6-4.7-2.4-6.6-9-9 6.6-2.4 8.4-4.3 9-9Z" fill={color} />
    </svg>
  );
}

export function HeartDeco({ size = 18, color = '#e8b4c8', style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M12 21s-8-4.7-8-10.6A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8 2.8C20 16.3 12 21 12 21Z" fill={color} />
    </svg>
  );
}

/** Gatito durmiendo sobre una luna: se usa en los estados vacíos. */
export function SleepyCat() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <path d="M78 22a40 40 0 1 0 22 62A34 34 0 0 1 78 22Z" fill="#ece6fa" />
      <ellipse cx="58" cy="88" rx="34" ry="14" fill="#f5f1fd" />
      <path d="M34 86c0-14 10-24 24-24s24 10 24 22c0 5-3 8-8 8H42c-5 0-8-2-8-6Z" fill="#fffaf3" stroke="#b9a7e8" strokeWidth="2" />
      <path d="M40 70 38 56l10 7M70 63l10-7-2 14" fill="#fffaf3" stroke="#b9a7e8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M47 76q3 2 6 0M63 76q3 2 6 0" stroke="#5e4b8b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="45" cy="81" rx="4" ry="2" fill="#f6c9d8" />
      <ellipse cx="71" cy="81" rx="4" ry="2" fill="#f6c9d8" />
      <path d="M82 86c10 0 14-6 10-10" stroke="#b9a7e8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="84" y="50" fontSize="12" fill="#8e7cc3" fontFamily="serif">z</text>
      <text x="92" y="40" fontSize="9" fill="#b9a7e8" fontFamily="serif">z</text>
      <path d="M22 30c.4 3 1.4 4 4.4 4.4-3 .4-4 1.4-4.4 4.4-.4-3-1.4-4-4.4-4.4 3-.4 4-1.4 4.4-4.4Z" fill="#f8e7a1" />
    </svg>
  );
}
