// Café de Mochi: los integrantes piden y el gatito arma la bandeja antes de que se acabe el tiempo.
import { useState } from 'react';
import { CAFE_MENU, CAFE_SECONDS, newOrder, trayMatches, trayOnTrack, type Order } from '../../lib/games2';
import { petDoc } from '../../lib/docs';
import { Cat } from '../../components/Cat';
import { GameIntro, GameResult, GameShell, useInterval } from './GameShell';

const emoji = (id: string) => CAFE_MENU.find((m) => m.id === id)?.emoji ?? '?';

export function CafeGame({ onClose }: { onClose: () => void }) {
  const pet = petDoc.get();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(CAFE_SECONDS);
  const [order, setOrder] = useState<Order>(() => newOrder());
  const [tray, setTray] = useState<string[]>([]);
  const [served, setServed] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  useInterval(
    () =>
      setLeft((l) => {
        if (l <= 1) setPhase('over');
        return l - 1;
      }),
    phase === 'play' ? 1000 : null,
  );

  const add = (id: string) => {
    if (phase !== 'play') return;
    const t = [...tray, id];
    if (!trayOnTrack(order, t)) {
      setMsg('¡Eso no lo pidió! 😅');
      setTray([]);
      setTimeout(() => setMsg(null), 900);
      return;
    }
    if (trayMatches(order, t)) {
      setServed((s) => s + 1);
      setMsg(`¡Gracias! dice ${order.member} ${order.emoji}`);
      setTimeout(() => setMsg(null), 900);
      setOrder(newOrder(Math.random, served + 1));
      setTray([]);
      return;
    }
    setTray(t);
  };
  const start = () => {
    setLeft(CAFE_SECONDS);
    setOrder(newOrder());
    setTray([]);
    setServed(0);
    setPhase('play');
    setRound((r) => r + 1);
  };

  return (
    <GameShell title="Café de Mochi" onClose={onClose} score={`${served} ☕ · ${left} s`}>
      <div className="cafe card">
        <div className="cafe-counter">
          <div className="cafe-customer">
            <span className="cafe-face" aria-hidden="true">
              {order.emoji}
            </span>
            <div className="cafe-bubble" data-testid="cafe-order">
              <small>{order.member} pide:</small>
              <div>{order.items.map((i, k) => <span key={k}>{emoji(i)}</span>)}</div>
            </div>
          </div>
          <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={msg?.startsWith('¡Gracias') ? 'gift' : msg ? 'wait' : 'idle'} size={86} />
        </div>
        <div className="cafe-tray" aria-label="Bandeja">
          {tray.length ? tray.map((i, k) => <span key={k}>{emoji(i)}</span>) : <span className="tiny muted">Bandeja vacía</span>}
        </div>
        {msg && <div className="cafe-msg" aria-live="polite">{msg}</div>}
        <div className="cafe-menu">
          {CAFE_MENU.map((m) => (
            <button key={m.id} type="button" className="cafe-item" onClick={() => add(m.id)} aria-label={m.name} data-testid="cafe-item" data-id={m.id}>
              <span>{m.emoji}</span>
              <small>{m.name}</small>
            </button>
          ))}
        </div>
        {tray.length > 0 && (
          <button className="btn ghost sm" onClick={() => setTray([])} type="button">
            Vaciar bandeja
          </button>
        )}
      </div>
      {phase === 'intro' && (
        <GameIntro title="Café de Mochi ☕" onStart={start}>
          Los integrantes vienen al café de {pet.name}. Mirá lo que pide cada uno y tocá esas cosas del menú (en cualquier orden) para servirle. Tenés {CAFE_SECONDS} segundos: ¿a cuántos atendés?
        </GameIntro>
      )}
      {phase === 'over' && (
        <div className="game-overlay">
          <GameResult key={round} game="cafe" score={served * 10} detail={`Atendiste ${served} pedidos.`} onAgain={start} onClose={onClose} />
        </div>
      )}
    </GameShell>
  );
}
