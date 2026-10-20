// ¿Quién es?: una pista sobre un integrante y cuatro opciones.
import { useState } from 'react';
import { clueRound } from '../../lib/games2';
import { MEMBERS } from '../../lib/bts';
import { GameResult, GameShell } from './GameShell';

const emojiOf = (name: string) => MEMBERS.find((m) => m.name === name)?.emoji ?? '💜';

export function WhoGame({ onClose }: { onClose: () => void }) {
  const [qs, setQs] = useState(() => clueRound());
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [round, setRound] = useState(0);
  const done = i >= qs.length;
  const q = qs[Math.min(i, qs.length - 1)];

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setRight((r) => r + 1);
  };
  const again = () => {
    setQs(clueRound());
    setI(0);
    setPicked(null);
    setRight(0);
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="¿Quién es?" onClose={onClose} score={`${right} ✓ · ${Math.min(i + 1, qs.length)}/${qs.length}`}>
      {!done && (
        <div className="quiz card">
          <div className="tiny muted">Pista {i + 1} de {qs.length}</div>
          <h2 className="quiz-q">🔎 {q.clue}</h2>
          <div className="who-grid">
            {q.options.map((o, k) => {
              const state = picked === null ? '' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim';
              return (
                <button key={o} type="button" className={`who-opt quiz-opt ${state}`} onClick={() => pick(k)} disabled={picked !== null} data-testid="who-option">
                  <span className="who-emoji">{emojiOf(o)}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="row spread" style={{ marginTop: 12 }}>
              <strong aria-live="polite">{picked === q.answer ? '¡Sí! 💜' : `Era ${q.options[q.answer]}`}</strong>
              <button className="btn sm" onClick={() => (setPicked(null), setI(i + 1))} type="button">
                {i + 1 < qs.length ? 'Siguiente' : 'Ver resultado'}
              </button>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="game-overlay">
          <GameResult key={round} game="quien" score={right * 10} detail={`Adivinaste ${right} de ${qs.length}.`} onAgain={again} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
