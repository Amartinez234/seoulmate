// Memoria de los 7: encontrar las parejas de cada integrante y el corazón morado.
import { useEffect, useState } from 'react';
import { memoryDeck, memoryScore, type MemoryCard } from '../../lib/games';
import { GameResult, GameShell, useInterval } from './GameShell';

export function MemoryGame({ onClose }: { onClose: () => void }) {
  const [deck, setDeck] = useState<MemoryCard[]>(() => memoryDeck());
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [round, setRound] = useState(0);
  const [lastMatch, setLastMatch] = useState<string | null>(null);
  const won = deck.every((c) => c.matched);
  useInterval(() => setSeconds((s) => s + 1), won ? null : 1000);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((i) => deck[i]);
    if (a.face === b.face) {
      setDeck((d) => d.map((c) => (c.face === a.face ? { ...c, matched: true } : c)));
      setLastMatch(a.label);
      setOpen([]);
      return;
    }
    const t = setTimeout(() => setOpen([]), 750);
    return () => clearTimeout(t);
  }, [open, deck]);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || deck[i].matched) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) setMoves((m) => m + 1);
  };
  const again = () => {
    setDeck(memoryDeck());
    setOpen([]);
    setMoves(0);
    setSeconds(0);
    setLastMatch(null);
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Memoria de los 7" onClose={onClose} score={`${moves} intentos · ${seconds} s`}>
      <p className="small muted center" style={{ margin: '4px 0 10px' }} aria-live="polite">
        {lastMatch ? `¡Encontraste a ${lastMatch}! 💜` : 'Encontrá las parejas de cada integrante y el corazón ARMY.'}
      </p>
      <div className="memory-grid">
        {deck.map((c, i) => {
          const shown = c.matched || open.includes(i);
          return (
            <button
              key={c.id}
              type="button"
              className={`memory-card ${shown ? 'shown' : ''} ${c.matched ? 'matched' : ''}`}
              onClick={() => flip(i)}
              aria-label={shown ? c.label : 'Carta boca abajo'}
              data-testid="memory-card"
              data-face={c.face}
            >
              <span className="memory-inner">
                <span className="memory-back" aria-hidden="true">
                  💜
                </span>
                <span className="memory-front" aria-hidden="true">
                  <span className="memory-emoji">{c.face}</span>
                  <span className="memory-label">{c.label}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {won && (
        <div className="game-overlay">
          <GameResult
            key={round}
            game="memoria"
            score={memoryScore(moves, seconds)}
            detail={`${moves} intentos en ${seconds} segundos.`}
            onAgain={again}
            onClose={onClose}
          />
        </div>
      )}
    </GameShell>
  );
}
