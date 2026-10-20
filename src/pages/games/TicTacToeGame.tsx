// Tres en raya contra el gatito: 💜 contra 🐾, al mejor de 3.
import { useEffect, useState } from 'react';
import { catMove, winner, type Cell } from '../../lib/games2';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameResult, GameShell } from './GameShell';

const GAMES = 3;

export function TicTacToeGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [game, setGame] = useState(0);
  const [tally, setTally] = useState({ win: 0, draw: 0, lose: 0 });
  const [round, setRound] = useState(0);
  const [thinking, setThinking] = useState(false);
  const result = winner(board);
  const finished = game >= GAMES;

  useEffect(() => {
    if (!thinking) return;
    const t = setTimeout(() => {
      setBoard((b) => {
        if (winner(b)) return b;
        const n = [...b];
        n[catMove(b)] = 'O';
        return n;
      });
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
  }, [thinking]);

  const play = (i: number) => {
    if (board[i] || result || thinking) return;
    const n = [...board];
    n[i] = 'X';
    setBoard(n);
    if (!winner(n)) setThinking(true);
  };
  const next = () => {
    setTally((t) => ({
      win: t.win + (result === 'X' ? 1 : 0),
      draw: t.draw + (result === 'empate' ? 1 : 0),
      lose: t.lose + (result === 'O' ? 1 : 0),
    }));
    setGame(game + 1);
    setBoard(Array(9).fill(null));
    // El gatito empieza en las partidas pares.
    if ((game + 1) % 2 === 1) setThinking(true);
  };
  const again = () => {
    setBoard(Array(9).fill(null));
    setGame(0);
    setTally({ win: 0, draw: 0, lose: 0 });
    setRound((r) => r + 1);
  };
  const score = tally.win * 30 + tally.draw * 15 + tally.lose * 5;

  return (
    <GameShell title="Tres en raya" onClose={onClose} score={`${tally.win}G ${tally.draw}E ${tally.lose}P · ${Math.min(game + 1, GAMES)}/${GAMES}`}>
      {!finished && (
        <div className="quiz card center">
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={result === 'O' ? 'gift' : result === 'X' ? 'wait' : thinking ? 'listen' : 'idle'} size={90} />
          <p className="small" aria-live="polite" style={{ margin: '4px 0 10px' }}>
            {result === 'X' ? '¡Ganaste! 💜' : result === 'O' ? `¡Ganó ${pet.name}! 🐾` : result === 'empate' ? 'Empate' : thinking ? `${pet.name} está pensando…` : 'Tu turno: sos 💜'}
          </p>
          <div className="ttt" data-testid="ttt">
            {board.map((c, i) => (
              <button key={i} type="button" className={`ttt-cell ${c ? 'filled' : ''}`} onClick={() => play(i)} aria-label={c ? (c === 'X' ? 'Tuyo' : 'Del gatito') : `Casilla ${i + 1}`} data-testid="ttt-cell">
                {c === 'X' ? '💜' : c === 'O' ? '🐾' : ''}
              </button>
            ))}
          </div>
          {result && (
            <button className="btn sm" onClick={next} type="button" style={{ marginTop: 12 }}>
              {game + 1 < GAMES ? 'Otra partida' : 'Ver resultado'}
            </button>
          )}
        </div>
      )}
      {finished && (
        <div className="game-overlay">
          <GameResult key={round} game="tateti" score={score} detail={`Ganaste ${tally.win}, empataste ${tally.draw} y perdiste ${tally.lose}.`} onAgain={again} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
