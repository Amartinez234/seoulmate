// Línea de tiempo: ordenar álbumes de BTS del más viejo al más nuevo.
import { useState } from 'react';
import { timelineHits, timelineRound } from '../../lib/games2';
import type { Album } from '../../lib/btsData';
import { GameResult, GameShell } from './GameShell';

const ROUNDS = 3;

export function TimelineGame({ onClose }: { onClose: () => void }) {
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState(0); // ronda actual (0..ROUNDS)
  const [pool, setPool] = useState<Album[]>(() => timelineRound());
  const [order, setOrder] = useState<Album[]>([]);
  const [checked, setChecked] = useState(false);
  const [total, setTotal] = useState(0);
  const done = stage >= ROUNDS;

  const place = (a: Album) => {
    if (checked) return;
    setOrder([...order, a]);
    setPool(pool.filter((x) => x !== a));
  };
  const unplace = (a: Album) => {
    if (checked) return;
    setOrder(order.filter((x) => x !== a));
    setPool([...pool, a]);
  };
  const check = () => {
    setChecked(true);
    setTotal((t) => t + timelineHits(order) * 7);
  };
  const next = () => {
    setStage(stage + 1);
    setPool(timelineRound());
    setOrder([]);
    setChecked(false);
  };
  const again = () => {
    setStage(0);
    setTotal(0);
    setPool(timelineRound());
    setOrder([]);
    setChecked(false);
    setRound((r) => r + 1);
  };
  const sorted = [...order].sort((a, b) => a.year - b.year);

  return (
    <GameShell title="Línea de tiempo" onClose={onClose} score={`${total} pts · ${Math.min(stage + 1, ROUNDS)}/${ROUNDS}`}>
      {!done && (
        <div className="quiz card">
          <p className="small" style={{ marginTop: 0 }}>
            Tocá los álbumes <strong>del más viejo al más nuevo</strong>. Si te equivocás, tocalo arriba para sacarlo.
          </p>
          <ol className="tl-order" data-testid="tl-order">
            {order.map((a, k) => {
              const ok = checked ? a.title === sorted[k].title : null;
              return (
                <li key={a.title}>
                  <button type="button" className={`tl-chip placed ${ok === null ? '' : ok ? 'right' : 'wrong'}`} onClick={() => unplace(a)}>
                    <span>{a.title}</span>
                    {checked && <strong>{a.year}</strong>}
                  </button>
                </li>
              );
            })}
            {Array.from({ length: pool.length }, (_, k) => (
              <li key={`e${k}`} className="tl-empty" aria-hidden="true" />
            ))}
          </ol>
          <div className="tl-pool">
            {pool.map((a) => (
              <button key={a.title} type="button" className="tl-chip" onClick={() => place(a)} data-testid="tl-album">
                💿 {a.title}
              </button>
            ))}
          </div>
          {!checked && pool.length === 0 && (
            <button className="btn block" onClick={check} type="button">
              Comprobar
            </button>
          )}
          {checked && (
            <div className="row spread">
              <strong aria-live="polite">
                {timelineHits(order) === order.length ? '¡Perfecto! 💜' : `${timelineHits(order)} de ${order.length} en su lugar`}
              </strong>
              <button className="btn sm" onClick={next} type="button">
                {stage + 1 < ROUNDS ? 'Siguiente' : 'Ver resultado'}
              </button>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="game-overlay">
          <GameResult key={round} game="linea" score={total} detail="Cada álbum en su lugar suma 7 puntos." onAgain={again} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
