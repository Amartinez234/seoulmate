import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useDoc, upsert, removeById, newId } from '../lib/store';
import { dramaDoc } from '../lib/docs';
import { validate, hasErrors } from '../lib/validation';
import { EMPTY_FILTERS, filterDramas, GENRES, MOODS, pickRandom, rouletteCandidates, STATUS_LABEL, type DramaFilters } from '../lib/dramas';
import type { Drama, DramaStatus } from '../lib/types';
import { Chips, DeleteButton, Empty, Field, FormActions, Modal, Stars, Tabs, toast, useForm } from '../components/ui';
import { IconDice } from '../components/icons';
import { isYouTubeLink } from '../lib/youtube';
import { playQueue } from '../lib/player';
import { isInList, pickToDrama, ROMANCE_PICKS, whereToWatch } from '../lib/romance';
import './dramas.css';

function safeHttpsUrl(v: string | undefined): URL | null {
  if (!v) return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

/** "Ver ahora": YouTube se reproduce dentro de la app; otras plataformas se abren en su app o web. */
function WatchButton({ drama }: { drama: Drama }) {
  const url = safeHttpsUrl(drama.watchLink);
  if (!url) return null;
  if (isYouTubeLink(url.href))
    return (
      <button
        className="btn rose sm"
        onClick={() => playQueue([{ id: drama.id, title: drama.title, subtitle: 'K-drama', link: url.href }])}
      >
        ▶ Ver aquí
      </button>
    );
  return (
    <a className="btn rose sm" href={url.href} target="_blank" rel="noreferrer">
      ▶ Ver en {url.hostname.replace(/^www\./, '')}
    </a>
  );
}

type DTab = 'lista' | 'romance' | 'ruleta' | 'recomendaciones';

const save = (d: Drama) => dramaDoc.update((x) => ({ ...x, dramas: upsert(x.dramas, { ...d, updatedAt: Date.now() }) }));

export function DramasPage() {
  const [tab, setTab] = useState<DTab>('lista');
  const [edit, setEdit] = useState<Drama | 'new' | 'new-rec' | null>(null);
  return (
    <div className="page">
      <Tabs<DTab>
        label="K-Drama Diary"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'lista', label: 'Mis dramas' },
          { id: 'romance', label: 'Romance 💜' },
          { id: 'ruleta', label: 'Ruleta' },
          { id: 'recomendaciones', label: 'Mis recomendaciones' },
        ]}
      />
      {tab === 'lista' && <DramaList onNew={() => setEdit('new')} onEdit={setEdit} />}
      {tab === 'romance' && <RomanceIdeas />}
      {tab === 'ruleta' && <Roulette />}
      {tab === 'recomendaciones' && <Recommendations onNew={() => setEdit('new-rec')} onEdit={setEdit} />}
      {edit && (
        <DramaForm
          drama={typeof edit === 'string' ? null : edit}
          defaultRecommend={edit === 'new-rec'}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function StatusTag({ s }: { s: DramaStatus }) {
  return <span className={`tag status-${s}`}>{STATUS_LABEL[s]}</span>;
}

function DramaList({ onNew, onEdit }: { onNew: () => void; onEdit: (d: Drama) => void }) {
  const { dramas } = useDoc(dramaDoc);
  const [f, setF] = useState<DramaFilters>(EMPTY_FILTERS);
  const [detail, setDetail] = useState<string | null>(null);
  const shown = useMemo(() => filterDramas(dramas, f), [dramas, f]);
  const allGenres = useMemo(() => [...new Set([...GENRES, ...dramas.flatMap((d) => d.genres)])], [dramas]);
  const counts = (s: DramaStatus) => dramas.filter((d) => d.status === s).length;
  const current = dramas.find((d) => d.id === detail) ?? null;
  return (
    <div>
      <div className="grid3" style={{ marginBottom: 12 }}>
        {(['pendiente', 'en-curso', 'terminado'] as DramaStatus[]).map((s) => (
          <button
            key={s}
            className={`card center stat-card ${f.status === s ? 'soft' : ''}`}
            onClick={() => setF({ ...f, status: f.status === s ? 'todos' : s })}
            aria-pressed={f.status === s}
          >
            <div className="serif" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {counts(s)}
            </div>
            <div className="tiny">{STATUS_LABEL[s]}</div>
          </button>
        ))}
      </div>
      <details className="card filters">
        <summary>Buscar y filtrar</summary>
        <div style={{ height: 10 }} />
        <Field label="Buscar (título, actores o personajes)">
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </Field>
        <div className="grid2">
          <Field label="Estado">
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as DramaFilters['status'] })}>
              <option value="todos">Todos</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Género">
            <select value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })}>
              <option value="">Todos</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Puntuación mínima">
          <select value={f.minRating} onChange={(e) => setF({ ...f, minRating: Number(e.target.value) })}>
            <option value={0}>Cualquiera</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} o más
              </option>
            ))}
          </select>
        </Field>
        <button className="btn ghost sm" onClick={() => setF(EMPTY_FILTERS)}>
          Limpiar filtros
        </button>
      </details>
      <div className="row spread" style={{ margin: '4px 0 10px' }}>
        <span className="small muted" data-testid="drama-count">
          {shown.length} de {dramas.length}
        </span>
        <button className="btn sm" onClick={onNew}>
          + Drama
        </button>
      </div>
      {dramas.length === 0 ? (
        <Empty title="Tu lista de dramas está vacía" text="Agregá los que querés ver, los que estás viendo y los que ya terminaste." />
      ) : shown.length === 0 ? (
        <Empty title="Ningún drama coincide" text="Probá con otros filtros." />
      ) : (
        shown.map((d) => (
          <button className="item drama-item" key={d.id} onClick={() => setDetail(d.id)} data-testid="drama">
            <div className="grow" style={{ textAlign: 'left' }}>
              <div className="title">{d.title}</div>
              <div style={{ margin: '2px 0' }}>
                <StatusTag s={d.status} />
                {d.genres.slice(0, 3).map((g) => (
                  <span className="tag rose" key={g}>
                    {g}
                  </span>
                ))}
              </div>
              {d.rating > 0 && <Stars value={d.rating} />}
            </div>
            {d.recommend && <span title="La recomiendo">💌</span>}
          </button>
        ))
      )}
      {current && <DramaDetail drama={current} onClose={() => setDetail(null)} onEdit={() => (setDetail(null), onEdit(current))} />}
    </div>
  );
}

function DramaDetail({ drama, onClose, onEdit }: { drama: Drama; onClose: () => void; onEdit: () => void }) {
  const [ep, setEp] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return setErr('Escribí la nota.');
    if (note.length > 2000 || ep.length > 30) return setErr('El texto es demasiado largo.');
    await save({ ...drama, episodeNotes: [...drama.episodeNotes, { id: newId(), episode: ep.trim(), note: note.trim() }] });
    setEp('');
    setNote('');
    setErr('');
  };
  return (
    <Modal title={drama.title} onClose={onClose}>
      <div className="row wrap" style={{ marginBottom: 8 }}>
        {(['pendiente', 'en-curso', 'terminado'] as DramaStatus[]).map((s) => (
          <button key={s} className="chip" aria-pressed={drama.status === s} onClick={() => save({ ...drama, status: s })}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {drama.watchLink && (
        <div style={{ marginBottom: 8 }}>
          <WatchButton drama={drama} />
        </div>
      )}
      <Stars value={drama.rating} onChange={(v) => save({ ...drama, rating: v })} label="Mi puntuación" />
      {drama.genres.length > 0 && (
        <p>
          {drama.genres.map((g) => (
            <span className="tag rose" key={g}>
              {g}
            </span>
          ))}
          {drama.moods.map((m) => (
            <span className="tag butter" key={m}>
              {m}
            </span>
          ))}
        </p>
      )}
      {drama.review && (
        <div className="card soft">
          <strong className="small">Mi reseña</strong>
          <p className="pre" style={{ margin: 0 }}>
            {drama.review}
          </p>
        </div>
      )}
      {(drama.characters || drama.actors) && (
        <div className="card">
          {drama.characters && (
            <p className="small">
              <strong>Personajes favoritos:</strong> {drama.characters}
            </p>
          )}
          {drama.actors && (
            <p className="small" style={{ margin: 0 }}>
              <strong>Actores favoritos:</strong> {drama.actors}
            </p>
          )}
        </div>
      )}
      {drama.recommend && (
        <div className="card rose">
          <strong className="small">💌 La recomiendo</strong>
          {drama.recommendNote && <p className="small pre" style={{ margin: 0 }}>{drama.recommendNote}</p>}
        </div>
      )}
      <h3>Notas de escenas y episodios</h3>
      {drama.episodeNotes.length === 0 && <p className="small muted">Todavía no hay notas.</p>}
      {drama.episodeNotes.map((n) => (
        <div className="item" key={n.id}>
          <span className="tag">{n.episode ? `Ep. ${n.episode}` : 'Nota'}</span>
          <p className="grow small pre" style={{ margin: 0 }}>
            {n.note}
          </p>
          <DeleteButton label="Borrar nota" onConfirm={() => save({ ...drama, episodeNotes: drama.episodeNotes.filter((x) => x.id !== n.id) })} />
        </div>
      ))}
      <form onSubmit={addNote} className="card soft" noValidate>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div style={{ width: 90 }}>
            <Field label="Episodio">
              <input value={ep} onChange={(e) => setEp(e.target.value)} inputMode="numeric" placeholder="3" />
            </Field>
          </div>
          <div className="grow">
            <Field label="Nota" error={err}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="La escena que me encantó…" />
            </Field>
          </div>
        </div>
        <button className="btn sm">Agregar nota</button>
      </form>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn block" onClick={onEdit}>
          Editar datos
        </button>
      </div>
    </Modal>
  );
}

function DramaForm({ drama, defaultRecommend, onClose }: { drama: Drama | null; defaultRecommend?: boolean; onClose: () => void }) {
  const f = useForm({
    title: drama?.title ?? '',
    status: drama?.status ?? ('pendiente' as DramaStatus),
    genres: drama?.genres ?? ([] as string[]),
    moods: drama?.moods ?? ([] as string[]),
    rating: drama?.rating ?? 0,
    review: drama?.review ?? '',
    characters: drama?.characters ?? '',
    actors: drama?.actors ?? '',
    recommend: drama?.recommend ?? !!defaultRecommend,
    recommendNote: drama?.recommendNote ?? '',
    watchLink: drama?.watchLink ?? '',
  });
  const [customGenre, setCustomGenre] = useState('');
  const genreOptions = [...new Set([...GENRES, ...f.values.genres])];
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 120 },
      review: { label: 'Reseña', max: 5000 },
      characters: { label: 'Personajes', max: 300 },
      actors: { label: 'Actores', max: 300 },
      recommendNote: { label: 'Recomendación', max: 1000 },
    });
    if (f.values.watchLink.trim() && !safeHttpsUrl(f.values.watchLink)) errs.watchLink = 'Pegá un enlace que empiece con https://';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const now = Date.now();
    await save({
      id: drama?.id ?? newId(),
      episodeNotes: drama?.episodeNotes ?? [],
      createdAt: drama?.createdAt ?? now,
      updatedAt: now,
      ...f.values,
      title: f.values.title.trim(),
      watchLink: f.values.watchLink.trim(),
    });
    toast(drama ? 'Drama actualizado' : 'Drama agregado 🎬');
    onClose();
  };
  return (
    <Modal title={drama ? 'Editar drama' : 'Nuevo drama'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title} help="Escribilo tal cual; el catálogo es tuyo y se completa a mano.">
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Estado">
          <select value={f.values.status} onChange={(e) => f.set('status')(e.target.value as DramaStatus)}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="field">
          <span className="field-label">Géneros</span>
          <Chips options={genreOptions} value={f.values.genres} onChange={f.set('genres')} />
          <div className="row" style={{ marginTop: 8 }}>
            <input className="input grow" value={customGenre} onChange={(e) => setCustomGenre(e.target.value)} placeholder="Otro género…" aria-label="Otro género" />
            <button
              type="button"
              className="btn secondary sm"
              onClick={() => {
                const g = customGenre.trim().slice(0, 30);
                if (g && !f.values.genres.includes(g)) f.set('genres')([...f.values.genres, g]);
                setCustomGenre('');
              }}
            >
              Sumar
            </button>
          </div>
        </div>
        <div className="field">
          <span className="field-label">¿Para qué ánimo es? (usado por la ruleta)</span>
          <Chips options={MOODS} value={f.values.moods} onChange={f.set('moods')} />
        </div>
        <div className="field">
          <span className="field-label">Mi puntuación</span>
          <Stars value={f.values.rating} onChange={f.set('rating')} />
        </div>
        <Field label="Reseña (opcional)" error={f.errors.review}>
          <textarea value={f.values.review} onChange={(e) => f.set('review')(e.target.value)} />
        </Field>
        <Field label="Personajes favoritos (opcional)" error={f.errors.characters}>
          <input value={f.values.characters} onChange={(e) => f.set('characters')(e.target.value)} />
        </Field>
        <Field label="Actores favoritos (opcional)" error={f.errors.actors}>
          <input value={f.values.actors} onChange={(e) => f.set('actors')(e.target.value)} />
        </Field>
        <Field
          label="Dónde verlo (opcional)"
          error={f.errors.watchLink}
          help="Enlace de YouTube (se ve dentro de la app) o de Netflix, Viki, Disney+, etc. (se abre en esa app)."
        >
          <input value={f.values.watchLink} onChange={(e) => f.set('watchLink')(e.target.value)} inputMode="url" placeholder="https://…" />
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.values.recommend} onChange={(e) => f.set('recommend')(e.target.checked)} /> Lo recomiendo
        </label>
        {f.values.recommend && (
          <Field label="¿A quién y por qué?" error={f.errors.recommendNote}>
            <textarea value={f.values.recommendNote} onChange={(e) => f.set('recommendNote')(e.target.value)} />
          </Field>
        )}
        <FormActions onCancel={onClose} />
        {drama && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await dramaDoc.update((x) => ({ ...x, dramas: removeById(x.dramas, drama.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

const WHEEL_COLORS = ['#d9cdf5', '#f6d3e0', '#fdf0c7', '#ece6fa', '#f8e3eb', '#e4e6ee'];

function Roulette() {
  const { dramas } = useDoc(dramaDoc);
  const [mood, setMood] = useState('');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Drama | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<number>(0);
  const candidates = rouletteCandidates(dramas, mood);
  const wheel = candidates.slice(0, 12);
  const seg = 360 / Math.max(1, wheel.length);

  const spin = () => {
    const pick = pickRandom(wheel);
    if (!pick) return;
    const idx = wheel.indexOf(pick);
    // el puntero está arriba: llevamos el centro del segmento elegido a 0°
    const target = 360 * 5 + (360 - (idx * seg + seg / 2));
    const base = rotation - (rotation % 360);
    setResult(null);
    setSpinning(true);
    setRotation(base + target);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setResult(pick);
    }, 3200);
  };

  return (
    <div>
      <p className="small muted">Elegí cómo te sentís y la ruleta elige entre tus dramas pendientes o en curso.</p>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className="chip" aria-pressed={mood === ''} onClick={() => (setMood(''), setResult(null))}>
          Cualquiera
        </button>
        {MOODS.map((m) => (
          <button key={m} className="chip" aria-pressed={mood === m} onClick={() => (setMood(m), setResult(null))}>
            {m}
          </button>
        ))}
      </div>
      {wheel.length === 0 ? (
        <Empty
          title="No hay dramas para este ánimo"
          text={dramas.length ? 'Marcá el ánimo de tus dramas pendientes al editarlos, o elegí "Cualquiera".' : 'Primero agregá algunos dramas pendientes.'}
        />
      ) : (
        <div className="wheel-wrap">
          <div className="wheel-pointer" aria-hidden="true" />
          <svg
            className="wheel"
            viewBox="-100 -100 200 200"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3.1s cubic-bezier(0.15, 0.8, 0.2, 1)' : 'none' }}
            aria-hidden="true"
          >
            {wheel.map((d, i) => {
              const a0 = ((i * seg - 90) * Math.PI) / 180;
              const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
              const large = seg > 180 ? 1 : 0;
              const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
              const path =
                wheel.length === 1
                  ? 'M0 -96 A96 96 0 1 1 -0.01 -96 Z'
                  : `M0 0 L${96 * Math.cos(a0)} ${96 * Math.sin(a0)} A96 96 0 ${large} 1 ${96 * Math.cos(a1)} ${96 * Math.sin(a1)} Z`;
              const label = d.title.length > 14 ? d.title.slice(0, 13) + '…' : d.title;
              return (
                <g key={d.id}>
                  <path d={path} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#fff" strokeWidth="2" />
                  <text
                    x={58 * Math.cos(mid)}
                    y={58 * Math.sin(mid)}
                    fontSize={wheel.length > 8 ? 7 : 9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#5e4b8b"
                    fontWeight="700"
                    transform={`rotate(${(i + 0.5) * seg} ${58 * Math.cos(mid)} ${58 * Math.sin(mid)})`}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            <circle r="16" fill="#fff" stroke="#b9a7e8" strokeWidth="3" />
          </svg>
          <button className="btn rose block" onClick={spin} disabled={spinning} style={{ marginTop: 14 }}>
            <IconDice width={20} height={20} /> {spinning ? 'Girando…' : 'Girar la ruleta'}
          </button>
          {candidates.length > 12 && <p className="tiny muted center">Se muestran 12 de {candidates.length} opciones.</p>}
        </div>
      )}
      {result && (
        <div className="card rose center tape" role="status" data-testid="roulette-result" style={{ marginTop: 18 }}>
          <span className="tiny muted">Hoy te toca…</span>
          <h2 style={{ margin: '4px 0' }}>{result.title}</h2>
          <StatusTag s={result.status} />
          {result.watchLink && (
            <div style={{ marginTop: 10 }}>
              <WatchButton drama={result} />
            </div>
          )}
          {result.status === 'pendiente' && (
            <div style={{ marginTop: 10 }}>
              <button
                className="btn sm"
                onClick={async () => {
                  await save({ ...result, status: 'en-curso' });
                  setResult({ ...result, status: 'en-curso' });
                  toast('¡A disfrutar! Lo pasé a "En curso".');
                }}
              >
                Empezar a verlo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Recommendations({ onNew, onEdit }: { onNew: () => void; onEdit: (d: Drama) => void }) {
  const { dramas } = useDoc(dramaDoc);
  const recs = dramas.filter((d) => d.recommend).sort((a, b) => b.rating - a.rating || b.updatedAt - a.updatedAt);
  return (
    <div>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <span className="small muted">Los dramas que vos recomendarías.</span>
        <button className="btn sm" onClick={onNew}>
          + Recomendar
        </button>
      </div>
      {recs.length === 0 ? (
        <Empty title="Sin recomendaciones" text='Marcá "Lo recomiendo" en cualquier drama para que aparezca aquí.' />
      ) : (
        recs.map((d) => (
          <button className="card rose drama-item" key={d.id} onClick={() => onEdit(d)} style={{ width: '100%', textAlign: 'left' }}>
            <div className="row spread">
              <h3 style={{ margin: 0 }}>{d.title}</h3>
              {d.rating > 0 && <Stars value={d.rating} />}
            </div>
            {d.recommendNote && <p className="small pre" style={{ margin: '6px 0 0' }}>{d.recommendNote}</p>}
          </button>
        ))
      )}
    </div>
  );
}

/** Ideas de K-dramas de romance para sumar a la lista con un toque. */
function RomanceIdeas() {
  const { dramas } = useDoc(dramaDoc);
  const add = (p: (typeof ROMANCE_PICKS)[number]) => {
    if (isInList(dramas, p.title)) return;
    save(pickToDrama(p));
    toast(`"${p.title}" se sumó a tus pendientes`);
  };
  return (
    <div>
      <p className="small muted" style={{ marginTop: 0 }}>
        Clásicos del romance coreano. Sumá los que te tienten a tu lista y la ruleta los va a tener en cuenta.
      </p>
      {ROMANCE_PICKS.map((p) => {
        const added = isInList(dramas, p.title);
        return (
          <article className="card drama-item" key={p.title} data-testid="romance-pick">
            <div className="row spread">
              <h3 style={{ margin: 0 }}>{p.title}</h3>
              <span className="tiny muted">{p.year}</span>
            </div>
            {p.titleEs !== p.title && <div className="tiny muted">{p.titleEs}</div>}
            <p className="small" style={{ margin: '6px 0' }}>{p.pitch}</p>
            <div className="tiny muted">Con {p.leads}</div>
            <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
              <button className="btn sm" disabled={added} onClick={() => add(p)} aria-label={added ? `${p.title} ya está en tu lista` : `Agregar ${p.title} a mis dramas`}>
                {added ? '✓ En tu lista' : '+ A mi lista'}
              </button>
              {whereToWatch(p.title).map((w) => (
                <a key={w.label} className="btn ghost sm" href={w.url} target="_blank" rel="noreferrer">
                  {w.label}
                </a>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
