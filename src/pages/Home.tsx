import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useDoc } from '../lib/store';
import { chapterDoc, petDoc, settingsDoc } from '../lib/docs';
import { formatLong, isUnlocked, countdownText, togetherCounter } from '../lib/dates';
import { phraseOfDay } from '../lib/phrases';
import { levelInfo, moodOf, tick } from '../lib/pet';
import { Cat } from '../components/Cat';
import { Bar } from '../components/ui';
import { Blossom, HeartDeco, Star4 } from '../components/deco';
import { IconBook, IconGift, IconHeart, IconMusic, IconTv } from '../components/icons';
import './home.css';

function greeting(h: number) {
  if (h < 6) return 'Dulces sueños';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HomePage({ visitGift, onGiftSeen }: { visitGift: string | null; onGiftSeen: () => void }) {
  const settings = useDoc(settingsDoc);
  const petRaw = useDoc(petDoc);
  const chapter = useDoc(chapterDoc);
  const now = new Date();
  const pet = useMemo(() => tick(petRaw), [petRaw]);
  const lvl = levelInfo(pet.xp);
  const mood = moodOf(pet.stats);

  const surprise = useMemo(() => {
    const ready = [
      ...chapter.surprises.filter((s) => isUnlocked(s.unlockDate) && !s.openedAt),
      ...chapter.letters.filter((l) => l.unlockDate && isUnlocked(l.unlockDate) && !l.openedAt),
    ];
    const upcoming = [...chapter.surprises.map((s) => s.unlockDate), ...chapter.letters.map((l) => l.unlockDate)]
      .filter((d): d is string => !!d && !isUnlocked(d))
      .sort()[0];
    return { ready: ready.length, upcoming };
  }, [chapter]);

  const together = togetherCounter(chapter.togetherSince);

  return (
    <div className="page home">
      <section className="hello">
        <Star4 size={14} style={{ position: 'absolute', right: 26, top: 6 }} />
        <Blossom size={20} style={{ position: 'absolute', right: 2, top: 26 }} />
        <p className="hello-date">{formatLong(now)}</p>
        <h1 className="hello-title">
          {greeting(now.getHours())}, <span className="name">{settings.nickname || 'linda'}</span>
        </h1>
        <p className="hello-ko" lang="ko">
          안녕 💜
        </p>
      </section>

      <section className="card phrase tape" aria-label="Frase del día">
        <span className="tiny muted">Frase del día</span>
        <p className="serif phrase-text">{phraseOfDay(now, settings.customPhrases)}</p>
      </section>

      {visitGift && (
        <section className="card butter row" role="status">
          <IconGift width={28} height={28} style={{ color: '#c9a23a', flexShrink: 0 }} />
          <p className="grow" style={{ margin: 0 }}>
            <strong>{visitGift}</strong>
          </p>
          <button className="btn ghost sm" onClick={onGiftSeen}>
            Ok
          </button>
        </section>
      )}

      <Link to="/gatito" className="card pet-card" aria-label="Ir al Cat Café">
        {pet.adopted ? (
          <>
            <Cat breed={pet.breed} accessory={pet.equipped.accessory} mood={pet.stats.energy < 30 ? 'sleepy' : 'idle'} size={104} title={pet.name} />
            <div className="grow">
              <h3 style={{ margin: 0 }}>{pet.name}</h3>
              <p className="small muted" style={{ margin: '0 0 6px' }}>
                Está {mood.label} {mood.emoji} · Nivel {lvl.level}
              </p>
              <Bar value={(lvl.into / lvl.need) * 100} label="Progreso de nivel" />
              <p className="tiny muted" style={{ margin: '4px 0 0' }}>
                {lvl.into}/{lvl.need} XP · {pet.hearts} 💗
              </p>
            </div>
          </>
        ) : (
          <>
            <Cat breed="gris" mood="idle" size={96} />
            <div className="grow">
              <h3 style={{ margin: 0 }}>Un gatito te espera</h3>
              <p className="small muted" style={{ margin: 0 }}>
                Tocá aquí para elegirlo y ponerle nombre.
              </p>
            </div>
          </>
        )}
      </Link>

      <nav className="shortcuts" aria-label="Accesos directos">
        <Link to="/bts" className="shortcut s-bts">
          <IconMusic />
          <span>BTS World</span>
        </Link>
        <Link to="/dramas" className="shortcut s-drama">
          <IconTv />
          <span>K-Dramas</span>
        </Link>
        <Link to="/diario" className="shortcut s-diary">
          <IconBook />
          <span>Mi diario</span>
        </Link>
        <Link to="/nosotros" className="shortcut s-us">
          <IconHeart />
          <span>Nuestro rincón</span>
        </Link>
      </nav>

      <section className="card rose surprise-card">
        <HeartDeco size={20} style={{ position: 'absolute', right: 14, top: 12 }} />
        {surprise.ready > 0 ? (
          <>
            <h3>💌 Tenés {surprise.ready === 1 ? 'una sorpresa lista' : `${surprise.ready} sorpresas listas`}</h3>
            <p className="small muted">Alguien dejó algo especial para vos.</p>
            <Link to="/nosotros?tab=sorpresas" className="btn rose">
              Abrir sorpresa
            </Link>
          </>
        ) : surprise.upcoming ? (
          <>
            <h3>🔒 Próxima sorpresa {countdownText(surprise.upcoming)}</h3>
            <p className="small muted">Se desbloquea sola en la fecha indicada.</p>
          </>
        ) : (
          <>
            <h3>💌 Cofre de sorpresas</h3>
            <p className="small muted">Todavía no hay sorpresas programadas. Pronto puede aparecer algo aquí…</p>
          </>
        )}
        {together && (
          <p className="small" style={{ margin: '8px 0 0' }}>
            Juntos desde hace <strong>{together.totalDays.toLocaleString('es')}</strong> días 💜
          </p>
        )}
      </section>
    </div>
  );
}
