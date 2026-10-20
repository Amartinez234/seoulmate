// Sopa ARMY: encontrar los nombres de los 7 y palabras del fandom.
import { useState } from 'react';
import { lineCells, makeWordGrid, matchWord } from '../../lib/games2';
import { GameResult, GameShell, useInterval } from './GameShell';

export function WordSearchGame({ onClose }: { onClose: () => void }) {
  const [grid, setGrid] = useState(() => makeWordGrid());
  const [found, setFound] = useState<string[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [miss, setMiss] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [round, setRound] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const done = gaveUp || found.length === grid.words.length;
  useInterval(() => setSeconds((s) => s + 1), done ? null : 1000);

  const foundCells = new Set(grid.words.filter((w) => found.includes(w.word)).flatMap((w) => w.cells));
  const tap = (i: number) => {
    if (done) return;
    if (first === null) {
      setFirst(i);
      return;
    }
    const cells = lineCells(grid.size, first, i);
    setFirst(null);
    const w = cells && matchWord(grid, cells);
    if (w && !found.includes(w.word)) setFound([...found, w.word]);
    else if (cells) {
      setMiss(cells);
      setTimeout(() => setMiss([]), 400);
    }
  };
  const again = () => {
    setGrid(makeWordGrid());
    setFound([]);
    setFirst(null);
    setSeconds(0);
    setGaveUp(false);
    setRound((r) => r + 1);
  };
  const score = found.length * 10 + (found.length === grid.words.length ? Math.max(0, 30 - Math.floor(seconds / 10)) : 0);

  return (
    <GameShell title="Sopa ARMY" onClose={onClose} score={`${found.length}/${grid.words.length} · ${seconds} s`}>
      <p className="small muted center" style={{ margin: '2px 0 8px' }}>
        Tocá la primera letra y después la última de cada palabra.
      </p>
      <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))` }} data-testid="ws-grid">
        {grid.letters.map((l, i) => (
          <button
            key={i}
            type="button"
            className={`ws-cell ${foundCells.has(i) ? 'found' : ''} ${first === i ? 'first' : ''} ${miss.includes(i) ? 'miss' : ''}`}
            onClick={() => tap(i)}
            data-testid="ws-cell"
            data-i={i}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="ws-words">
        {grid.words.map((w) => (
          <span key={w.word} className={`tag ${found.includes(w.word) ? 'ws-done' : ''}`}>
            {w.word}
          </span>
        ))}
      </div>
      {!done && (
        <button className="btn ghost sm" onClick={() => setGaveUp(true)} type="button" style={{ alignSelf: 'center' }}>
          Terminar acá
        </button>
      )}
      {done && (
        <div className="game-overlay">
          <GameResult key={round} game="sopa" score={score} detail={`Encontraste ${found.length} de ${grid.words.length} palabras en ${seconds} s.`} onAgain={again} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
