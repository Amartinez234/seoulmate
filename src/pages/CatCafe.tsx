import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoc } from '../lib/store';
import { personalDoc, petDoc } from '../lib/docs';
import {
  adopt, applyAction, BREEDS, buyItem, claimMission, cooldownLeft, isEquipped, levelInfo, MISSIONS, missionDone, moodOf, SHOP,
  tick, toggleEquip, type Breed, type ItemKind, type PetAction, type PetState,
} from '../lib/pet';
import { todayKey } from '../lib/dates';
import { Cat, type CatMood } from '../components/Cat';
import { ItemArt, Room, type Particle } from '../components/Room';
import { Bar, Field, Tabs, errorMessage, toast } from '../components/ui';
import { GamesHub } from './games/GamesHub';

const PARTICLES: Record<PetAction, string[]> = {
  feed: ['🍙', '✨', '💛'],
  play: ['⭐', '✨', '🎀'],
  pet: ['💜', '💗', '💕'],
};

export function CatCafePage() {
  const raw = useDoc(petDoc);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const pet = useMemo(() => tick(raw, now), [raw, now]);
  if (!raw.adopted) return <Adoption />;
  return <CafeRoom pet={pet} now={now} />;
}

function Adoption() {
  const [breed, setBreed] = useState<Breed>('crema');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await petDoc.update((p) => adopt(p, name, breed));
      toast(`¡Bienvenido/a, ${name.trim()}! 🐾`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="page">
      <form className="card tape" onSubmit={submit} noValidate>
        <h2>Elegí tu gatito</h2>
        <p className="small muted">Va a vivir en su habitación del Cat Café y crecerá con tus visitas.</p>
        <div className="grid2" role="radiogroup" aria-label="Pelaje">
          {BREEDS.map((b) => (
            <button
              type="button"
              key={b.id}
              role="radio"
              aria-checked={breed === b.id}
              className={`card center ${breed === b.id ? 'soft' : ''}`}
              style={{ margin: 0, cursor: 'pointer', borderWidth: breed === b.id ? 2 : 1, borderColor: breed === b.id ? 'var(--violet)' : undefined }}
              onClick={() => setBreed(b.id)}
            >
              <Cat breed={b.id} size={96} title={b.label} />
              <div className="small" style={{ fontWeight: 700 }}>
                {b.label}
              </div>
            </button>
          ))}
        </div>
        <div style={{ height: 14 }} />
        <Field label="Nombre" error={error}>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={30}
            placeholder="Por ejemplo: Mochi"
          />
        </Field>
        <button className="btn block">Adoptar</button>
      </form>
    </div>
  );
}

type CafeTab = 'acciones' | 'juegos' | 'tienda' | 'misiones';

function CafeRoom({ pet, now }: { pet: PetState; now: number }) {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<CafeTab>(params.get('tab') === 'juegos' ? 'juegos' : 'acciones');
  const [mood, setMood] = useState<CatMood>('idle');
  const [speech, setSpeech] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const lvl = levelInfo(pet.xp);
  const m = moodOf(pet.stats);
  const restingMood: CatMood = pet.stats.energy < 30 ? 'sleepy' : 'idle';

  const act = async (action: PetAction) => {
    const { state, outcome } = applyAction(petDoc.get(), action);
    if (outcome.ok) await petDoc.replace(state);
    setMood(outcome.reaction);
    setSpeech(outcome.heartsEarned ? `${outcome.message} +${outcome.heartsEarned} 💗` : outcome.message);
    if (outcome.ok) {
      const ps = PARTICLES[action].map((char, i) => ({ id: ++seq.current, char, left: 38 + i * 10 + Math.random() * 6 }));
      setParticles((p) => [...p, ...ps]);
      later(() => setParticles((p) => p.filter((x) => !ps.includes(x))), 1500);
    }
    later(() => setMood('idle'), 1600);
    later(() => setSpeech(null), 2600);
  };

  return (
    <div className="page">
      <div className="row spread" style={{ marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>{pet.name}</h2>
          <span className="small muted">
            Está {m.label} {m.emoji} · Nivel {lvl.level}
          </span>
        </div>
        <span className="tag butter" style={{ fontSize: '0.95rem', padding: '6px 12px' }} data-testid="hearts">
          {pet.hearts} 💗
        </span>
      </div>
      <Room pet={pet} mood={mood === 'idle' ? restingMood : mood} speech={speech} particles={particles} onCatClick={() => act('pet')} />

      <div className="card" style={{ padding: 14 }}>
        <Stat label="Cariño" value={pet.stats.affection} tone="rose" />
        <Stat label="Energía" value={pet.stats.energy} tone="butter" />
        <Stat label="Felicidad" value={pet.stats.happiness} />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Nivel {lvl.level}: {lvl.into}/{lvl.need} XP. Si pasan días sin visitarlo, solo descansa: nunca se enferma ni pierde cariño.
        </div>
      </div>

      <Tabs<CafeTab>
        label="Cat Café"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'acciones', label: 'Mimos' },
          { id: 'juegos', label: 'Juegos 🎮' },
          { id: 'tienda', label: 'Tienda y decoración' },
          { id: 'misiones', label: 'Recompensas' },
        ]}
      />
      {tab === 'acciones' && (
        <div className="grid3">
          <ActionButton label="Alimentar" emoji="🍙" left={cooldownLeft(pet, 'feed', now)} onClick={() => act('feed')} />
          <ActionButton label="Jugar" emoji="🧶" left={cooldownLeft(pet, 'play', now)} onClick={() => act('play')} />
          <ActionButton label="Acariciar" emoji="🤍" left={cooldownLeft(pet, 'pet', now)} onClick={() => act('pet')} />
        </div>
      )}
      {tab === 'juegos' && <GamesHub pet={pet} />}
      {tab === 'tienda' && <Shop pet={pet} />}
      {tab === 'misiones' && <Missions pet={pet} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'rose' | 'butter' }) {
  return (
    <div className="row" style={{ marginBottom: 6 }}>
      <span className="small" style={{ width: 76, fontWeight: 700 }}>
        {label}
      </span>
      <div className="grow">
        <Bar value={value} tone={tone} label={label} />
      </div>
      <span className="small muted" style={{ width: 32, textAlign: 'right' }} data-testid={`stat-${label}`}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({ label, emoji, left, onClick }: { label: string; emoji: string; left: number; onClick: () => void }) {
  return (
    <button className="card center" style={{ margin: 0, cursor: 'pointer', minHeight: 92 }} onClick={onClick} type="button">
      <div style={{ fontSize: 28 }} aria-hidden="true">
        {emoji}
      </div>
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div className="tiny muted">{left > 0 ? `en ${Math.ceil(left / 1000)} s` : 'listo'}</div>
    </button>
  );
}

const KIND_LABEL: Record<ItemKind, string> = {
  accessory: 'Accesorios',
  toy: 'Juguetes',
  bed: 'Camas',
  decor: 'Decoración (hasta 3)',
  wallpaper: 'Paredes',
};

function Shop({ pet }: { pet: PetState }) {
  const { level } = levelInfo(pet.xp);
  const buy = async (id: string) => {
    try {
      await petDoc.update((p) => buyItem(p, id));
      toast('¡Desbloqueado! Ya podés usarlo.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };
  const equip = async (id: string) => {
    try {
      await petDoc.update((p) => toggleEquip(p, id));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };
  return (
    <div>
      {(Object.keys(KIND_LABEL) as ItemKind[]).map((kind) => (
        <section key={kind}>
          <h3 style={{ margin: '14px 0 8px' }}>{KIND_LABEL[kind]}</h3>
          <div className="grid2">
            {SHOP.filter((i) => i.kind === kind).map((item) => {
              const owned = pet.owned.includes(item.id);
              const on = isEquipped(pet, item.id);
              const locked = level < item.minLevel;
              return (
                <div key={item.id} className="card" style={{ margin: 0, padding: 12 }} data-testid={`item-${item.id}`}>
                  <div style={{ height: 56, display: 'grid', placeItems: 'center' }}>
                    <div style={{ width: 56, height: 56 }}>
                      <ItemArt id={item.id} />
                    </div>
                  </div>
                  <div className="small" style={{ fontWeight: 700, marginTop: 6 }}>
                    {item.name}
                  </div>
                  {owned ? (
                    <button className={`btn sm block ${on ? 'secondary' : ''}`} onClick={() => equip(item.id)} style={{ marginTop: 6 }}>
                      {kind === 'wallpaper' ? (on ? 'En uso' : 'Usar') : on ? 'Quitar' : 'Colocar'}
                    </button>
                  ) : (
                    <button className="btn sm block rose" onClick={() => buy(item.id)} style={{ marginTop: 6 }} disabled={locked}>
                      {locked ? `Nivel ${item.minLevel}` : `${item.cost} 💗`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Missions({ pet }: { pet: PetState }) {
  const personal = useDoc(personalDoc);
  const today = todayKey();
  const ctx = { wroteDiaryToday: personal.diary.some((d) => d.date === today || todayKey(new Date(d.createdAt)) === today) };
  const claim = async (id: (typeof MISSIONS)[number]['id']) => {
    try {
      await petDoc.update((p) => claimMission(p, id, ctx));
      toast('¡Recompensa recibida! 💗');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };
  return (
    <div>
      <p className="small muted">
        Opcionales y sin presión: se renuevan cada día y no se pierde nada si no las hacés. También ganás corazones por visitar
        ({pet.visits.totalDays} {pet.visits.totalDays === 1 ? 'día' : 'días'} de visitas) y al completar tareas de tu diario.
      </p>
      {MISSIONS.map((mi) => {
        const done = missionDone(pet, mi.id, ctx);
        const claimed = pet.today.missionsClaimed.includes(mi.id);
        return (
          <div className="item" key={mi.id} style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 22 }} aria-hidden="true">
              {claimed ? '✅' : done ? '🎁' : '⬜'}
            </span>
            <div className="grow">
              <div className="title">{mi.label}</div>
              <div className="tiny muted">+{mi.reward} 💗</div>
            </div>
            <button className="btn sm" disabled={!done || claimed} onClick={() => claim(mi.id)}>
              {claimed ? 'Hecho' : 'Reclamar'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
