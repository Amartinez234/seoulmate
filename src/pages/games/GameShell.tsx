// Marco a pantalla completa para los minijuegos y la pantalla de resultado con premios.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { petDoc } from '../../lib/docs';
import { rewardGame, type GameId, type GameReward } from '../../lib/pet';
import { Cat } from '../../components/Cat';

export function GameShell({ title, score, onClose, children }: { title: string; score?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className="game-shell" role="dialog" aria-modal="true" aria-label={title}>
      <header className="game-top">
        <button className="btn ghost sm" onClick={onClose} type="button">
          ✕ Salir
        </button>
        <strong className="game-title">{title}</strong>
        <span className="game-score" data-testid="game-score">
          {score}
        </span>
      </header>
      <div className="game-body">{children}</div>
    </div>,
    document.body,
  );
}

/** Aplica el premio una sola vez por partida y lo muestra. */
export function GameResult({
  game,
  score,
  detail,
  onAgain,
  onClose,
}: {
  game: GameId;
  score: number;
  detail?: string;
  onAgain: () => void;
  onClose: () => void;
}) {
  const [reward, setReward] = useState<GameReward | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const r = rewardGame(petDoc.get(), game, score);
    setReward(r);
    void petDoc.replace(r.state);
  }, [game, score]);
  const pet = petDoc.get();
  return (
    <div className="game-result card center" role="status" data-testid="game-result">
      <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={score > 0 ? 'gift' : 'pet'} size={120} />
      <h2 style={{ margin: '6px 0 2px' }}>{reward?.newRecord ? '¡Nuevo récord! 🏆' : '¡Bien jugado!'}</h2>
      <div className="game-big">{score} puntos</div>
      {detail && <p className="small muted" style={{ margin: '4px 0' }}>{detail}</p>}
      {reward && (
        <p className="small" style={{ margin: '6px 0 12px' }}>
          {reward.hearts > 0 ? `+${reward.hearts} 💗 para ${pet.name}` : reward.capped ? `Por hoy ya ganaste todos los corazones de juegos. ¡${pet.name} igual está feliz!` : `${pet.name} se divirtió mucho.`}
          {' · '}Récord: {pet.best?.[game] ?? score}
        </p>
      )}
      <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
        <button className="btn" onClick={onAgain} type="button">
          Jugar otra vez
        </button>
        <button className="btn secondary" onClick={onClose} type="button">
          Volver
        </button>
      </div>
    </div>
  );
}

export function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [ms]);
}
