// "Nuestro capítulo": el espacio romántico. El contenido lo carga él en modo autor (con PIN).
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoc, upsert, removeById, newId } from '../lib/store';
import { chapterDoc, settingsDoc } from '../lib/docs';
import { validate, hasErrors } from '../lib/validation';
import { countdownText, daysToNextMonthiversary, formatKey, isUnlocked, togetherCounter, todayKey } from '../lib/dates';
import { deleteMedia } from '../lib/media';
import { setAuthorMode, useAuthorMode, verifyAuthorPin } from '../lib/session';
import type { ChapterData, DatePlan, Letter, OccasionMessage, PhotoMemory, PlanStatus, Surprise, TimelineEvent } from '../lib/types';
import { DeleteButton, Empty, Field, FormActions, ImagePicker, MediaImg, Modal, Tabs, toast, useForm } from '../components/ui';
import { IconEdit, IconMail } from '../components/icons';
import { HeartDeco, Blossom } from '../components/deco';
import './chapter.css';

type CTab = 'contador' | 'historia' | 'fotos' | 'cartas' | 'sorpresas' | 'mensajes' | 'citas';
const TABS: Array<{ id: CTab; label: string }> = [
  { id: 'contador', label: 'Contador' },
  { id: 'historia', label: 'Nuestra historia' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'cartas', label: 'Cartas' },
  { id: 'sorpresas', label: 'Sorpresas' },
  { id: 'mensajes', label: 'Para cada ocasión' },
  { id: 'citas', label: 'Citas' },
];

const upd = (fn: (c: ChapterData) => ChapterData) => chapterDoc.update(fn);

export function ChapterPage() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as CTab) || 'contador';
  const [tab, setTab] = useState<CTab>(TABS.some((t) => t.id === initial) ? initial : 'contador');
  const [surpriseLetter, setSurpriseLetter] = useState<Letter | null>(null);
  const chapter = useDoc(chapterDoc);
  const author = useAuthorMode();

  const changeTab = (t: CTab) => {
    setTab(t);
    setParams(t === 'contador' ? {} : { tab: t }, { replace: true });
  };

  const openRandomLetter = () => {
    const available = chapter.letters.filter((l) => isUnlocked(l.unlockDate));
    if (!available.length) {
      toast('Todavía no hay cartas para abrir. ¡Pronto!');
      return;
    }
    const unopened = available.filter((l) => !l.openedAt);
    const pool = unopened.length ? unopened : available;
    setSurpriseLetter(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="page">
      <AuthorBar />
      <button className="surprise-btn" onClick={openRandomLetter} aria-label="Abrir una carta sorpresa">
        <IconMail />
        <span>Carta sorpresa</span>
      </button>
      <Tabs<CTab> label="Nuestro capítulo" value={tab} onChange={changeTab} tabs={TABS} />
      {tab === 'contador' && <Counter author={author} />}
      {tab === 'historia' && <Timeline author={author} />}
      {tab === 'fotos' && <Photos author={author} />}
      {tab === 'cartas' && <Letters author={author} />}
      {tab === 'sorpresas' && <Surprises author={author} />}
      {tab === 'mensajes' && <Occasions author={author} />}
      {tab === 'citas' && <Plans />}
      {surpriseLetter && <LetterReader letter={surpriseLetter} onClose={() => setSurpriseLetter(null)} />}
    </div>
  );
}

// ---------- modo autor ----------
function AuthorBar() {
  const author = useAuthorMode();
  const settings = useDoc(settingsDoc);
  const [asking, setAsking] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const enter = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!settings.authorPin) {
      setAuthorMode(true);
      return;
    }
    if (await verifyAuthorPin(pin)) {
      setAuthorMode(true);
      setAsking(false);
      setPin('');
      setErr('');
    } else setErr('PIN incorrecto.');
  };
  if (author)
    return (
      <div className="author-bar on" role="status">
        <span>✍️ Modo autor: podés agregar y editar el contenido.</span>
        <button className="btn sm secondary" onClick={() => setAuthorMode(false)}>
          Salir
        </button>
      </div>
    );
  return (
    <>
      <div className="author-bar">
        <span className="small muted">¿Sos quien preparó este regalo?</span>
        <button className="btn sm ghost" onClick={() => (settings.authorPin ? setAsking(true) : enter())}>
          Modo autor
        </button>
      </div>
      {asking && (
        <Modal title="Modo autor" onClose={() => setAsking(false)}>
          <form onSubmit={enter} noValidate>
            <Field label="PIN de autor" error={err}>
              <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
            </Field>
            <FormActions onCancel={() => setAsking(false)} label="Entrar" />
          </form>
        </Modal>
      )}
    </>
  );
}

function AuthorHint() {
  return <p className="small muted center">El contenido de esta sección lo agrega quien preparó el regalo (modo autor).</p>;
}

// ---------- contador ----------
function Counter({ author }: { author: boolean }) {
  const { togetherSince } = useDoc(chapterDoc);
  const [date, setDate] = useState(togetherSince ?? '');
  const [err, setErr] = useState('');
  const t = togetherCounter(togetherSince);
  const next = daysToNextMonthiversary(togetherSince);
  const saveDate = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate({ date }, { date: { label: 'La fecha', required: true, date: true } });
    if (errs.date) return setErr(errs.date);
    if (date > todayKey()) return setErr('La fecha no puede ser futura.');
    await upd((c) => ({ ...c, togetherSince: date }));
    setErr('');
    toast('Fecha guardada 💜');
  };
  return (
    <div>
      {t ? (
        <div className="card counter tape center" data-testid="counter">
          <Blossom size={26} style={{ position: 'absolute', left: 12, top: 12 }} />
          <HeartDeco size={22} style={{ position: 'absolute', right: 14, bottom: 14 }} />
          <span className="small muted">Juntos desde el {formatKey(togetherSince)}</span>
          <div className="counter-big serif">{t.totalDays.toLocaleString('es')}</div>
          <div className="small">días</div>
          <div className="counter-parts">
            <div>
              <b>{t.years}</b>
              <span>{t.years === 1 ? 'año' : 'años'}</span>
            </div>
            <div>
              <b>{t.months}</b>
              <span>{t.months === 1 ? 'mes' : 'meses'}</span>
            </div>
            <div>
              <b>{t.days}</b>
              <span>{t.days === 1 ? 'día' : 'días'}</span>
            </div>
          </div>
          {next !== null && <p className="small muted" style={{ margin: 0 }}>Próximo mesiversario en {next} {next === 1 ? 'día' : 'días'}</p>}
        </div>
      ) : (
        <Empty title="El contador espera su fecha" text={author ? 'Elegí abajo la fecha en que empezó todo.' : 'Pronto aparecerá aquí nuestro tiempo juntos.'} />
      )}
      {author && (
        <form className="card soft" onSubmit={saveDate} noValidate>
          <Field label="Fecha de inicio" error={err}>
            <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <button className="btn sm">Guardar fecha</button>
        </form>
      )}
    </div>
  );
}

// ---------- línea de tiempo ----------
function Timeline({ author }: { author: boolean }) {
  const { timeline } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<TimelineEvent | 'new' | null>(null);
  const sorted = [...timeline].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      {author && (
        <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
          + Agregar momento
        </button>
      )}
      {sorted.length === 0 ? (
        <Empty title="Nuestra historia está por escribirse" text={author ? 'Agregá los momentos importantes con su fecha.' : undefined} />
      ) : (
        <ol className="timeline">
          {sorted.map((ev) => (
            <li key={ev.id}>
              <span className="tl-dot" aria-hidden="true" />
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="row spread">
                  <span className="tag butter">{formatKey(ev.date)}</span>
                  {author && (
                    <button className="iconbtn" aria-label="Editar momento" onClick={() => setEdit(ev)}>
                      <IconEdit />
                    </button>
                  )}
                </div>
                <h3 style={{ margin: '6px 0 4px' }}>{ev.title}</h3>
                {ev.imageId && <MediaImg id={ev.imageId} alt={ev.title} className="tl-img" />}
                {ev.description && <p className="small pre" style={{ margin: 0 }}>{ev.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!author && sorted.length === 0 && <AuthorHint />}
      {edit && <TimelineForm ev={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function TimelineForm({ ev, onClose }: { ev: TimelineEvent | null; onClose: () => void }) {
  const f = useForm({ date: ev?.date ?? '', title: ev?.title ?? '', description: ev?.description ?? '', imageId: ev?.imageId ?? (null as string | null) });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      date: { label: 'La fecha', required: true, date: true },
      title: { label: 'El título', required: true, max: 120 },
      description: { label: 'Descripción', max: 4000 },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    if (ev?.imageId && ev.imageId !== f.values.imageId) await deleteMedia(ev.imageId);
    await upd((c) => ({ ...c, timeline: upsert(c.timeline, { id: ev?.id ?? newId(), ...f.values, title: f.values.title.trim() }) }));
    onClose();
  };
  return (
    <Modal title={ev ? 'Editar momento' : 'Nuevo momento'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Fecha" error={f.errors.date}>
          <input type="date" value={f.values.date} onChange={(e) => f.set('date')(e.target.value)} />
        </Field>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Descripción (opcional)" error={f.errors.description}>
          <textarea value={f.values.description} onChange={(e) => f.set('description')(e.target.value)} />
        </Field>
        <ImagePicker label="Foto" value={f.values.imageId} onChange={f.set('imageId')} />
        <FormActions onCancel={onClose} />
        {ev && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await deleteMedia(ev.imageId);
                await upd((c) => ({ ...c, timeline: removeById(c.timeline, ev.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- fotos ----------
function Photos({ author }: { author: boolean }) {
  const { photos } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<PhotoMemory | 'new' | null>(null);
  const [view, setView] = useState<PhotoMemory | null>(null);
  const sorted = [...photos].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return (
    <div>
      {author && (
        <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
          + Subir foto
        </button>
      )}
      {sorted.length === 0 ? (
        <Empty title="Álbum de fotos vacío" text={author ? 'Subí fotos y recuerdos juntos.' : 'Pronto habrá fotos nuestras aquí.'} />
      ) : (
        <div className="photo-grid">
          {sorted.map((p) => (
            <button key={p.id} className="photo-tile" onClick={() => setView(p)} aria-label={`Ver foto ${p.caption}`}>
              <MediaImg id={p.imageId} alt={p.caption || 'Foto'} />
              <span>{p.caption}</span>
            </button>
          ))}
        </div>
      )}
      {view && (
        <Modal title={view.caption || 'Recuerdo'} onClose={() => setView(null)}>
          <MediaImg id={view.imageId} alt={view.caption} className="photo-large" />
          {view.date && <p className="small muted center">{formatKey(view.date)}</p>}
          {author && (
            <button className="btn block secondary" onClick={() => (setEdit(view), setView(null))}>
              Editar
            </button>
          )}
        </Modal>
      )}
      {edit && <PhotoForm photo={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function PhotoForm({ photo, onClose }: { photo: PhotoMemory | null; onClose: () => void }) {
  const f = useForm({ imageId: photo?.imageId ?? (null as string | null), caption: photo?.caption ?? '', date: photo?.date ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { caption: { label: 'Texto', max: 200 }, date: { label: 'Fecha', date: true } });
    if (!f.values.imageId) errs.imageId = 'Elegí una foto.';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    if (photo && photo.imageId !== f.values.imageId) await deleteMedia(photo.imageId);
    await upd((c) => ({ ...c, photos: upsert(c.photos, { id: photo?.id ?? newId(), ...f.values, imageId: f.values.imageId! }) }));
    onClose();
  };
  return (
    <Modal title={photo ? 'Editar foto' : 'Nueva foto'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <ImagePicker label="Foto" required value={f.values.imageId} onChange={f.set('imageId')} error={f.errors.imageId} />
        <Field label="Texto (opcional)" error={f.errors.caption}>
          <input value={f.values.caption} onChange={(e) => f.set('caption')(e.target.value)} />
        </Field>
        <Field label="Fecha (opcional)" error={f.errors.date}>
          <input type="date" value={f.values.date} onChange={(e) => f.set('date')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {photo && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await deleteMedia(photo.imageId);
                await upd((c) => ({ ...c, photos: removeById(c.photos, photo.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- cartas ----------
function LetterReader({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const author = useAuthorMode();
  // Solo cuenta como "leída" si la abre ella (no en la vista previa del modo autor).
  const markRead = !author && isUnlocked(letter.unlockDate) && !letter.openedAt;
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 650);
    if (markRead) {
      upd((c) => ({ ...c, letters: c.letters.map((l) => (l.id === letter.id ? { ...l, openedAt: Date.now() } : l)) }));
    }
    return () => clearTimeout(t);
  }, [letter.id, markRead]);
  return (
    <Modal title={letter.title} onClose={onClose}>
      {!open ? (
        <div className="envelope opening" aria-label="Abriendo carta">
          <div className="env-flap" />
          <HeartDeco size={30} color="#c97f9c" style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)' }} />
        </div>
      ) : (
        <article className="letter-paper" data-testid="letter-body">
          <p className="pre serif">{letter.body}</p>
        </article>
      )}
    </Modal>
  );
}

function Letters({ author }: { author: boolean }) {
  const { letters } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<Letter | 'new' | null>(null);
  const [reading, setReading] = useState<Letter | null>(null);
  const sorted = [...letters].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      {author && (
        <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
          + Escribir carta
        </button>
      )}
      {sorted.length === 0 ? (
        <Empty title="Todavía no hay cartas" text={author ? 'Escribí tu primera carta. Podés programarla para una fecha.' : 'Las cartas aparecerán aquí.'} />
      ) : (
        sorted.map((l) => {
          const unlocked = isUnlocked(l.unlockDate);
          return (
            <div className={`letter-item ${unlocked ? '' : 'locked'}`} key={l.id} data-testid="letter">
              <div className="letter-icon" aria-hidden="true">
                {unlocked ? (l.openedAt ? '💌' : '✉️') : '🔒'}
              </div>
              <div className="grow">
                <div className="title">{l.title}</div>
                <div className="tiny muted">
                  {unlocked ? (l.openedAt ? 'Leída' : 'Nueva · sin abrir') : `Se abre ${countdownText(l.unlockDate!)} (${formatKey(l.unlockDate)})`}
                </div>
              </div>
              {(unlocked || author) && (
                <button className="btn sm rose" onClick={() => setReading(l)}>
                  {unlocked ? 'Leer' : 'Ver'}
                </button>
              )}
              {author && (
                <button className="iconbtn" aria-label="Editar carta" onClick={() => setEdit(l)}>
                  <IconEdit />
                </button>
              )}
            </div>
          );
        })
      )}
      {reading && <LetterReader letter={reading} onClose={() => setReading(null)} />}
      {edit && <LetterForm letter={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function LetterForm({ letter, onClose }: { letter: Letter | null; onClose: () => void }) {
  const f = useForm({ title: letter?.title ?? '', body: letter?.body ?? '', unlockDate: letter?.unlockDate ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 120 },
      body: { label: 'La carta', required: true, max: 20000 },
      unlockDate: { label: 'Fecha', date: true },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    await upd((c) => ({
      ...c,
      letters: upsert(c.letters, {
        id: letter?.id ?? newId(),
        createdAt: letter?.createdAt ?? Date.now(),
        openedAt: letter?.openedAt ?? null,
        title: f.values.title.trim(),
        body: f.values.body,
        unlockDate: f.values.unlockDate || null,
      }),
    }));
    toast('Carta guardada 💌');
    onClose();
  };
  return (
    <Modal title={letter ? 'Editar carta' : 'Nueva carta'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Carta" error={f.errors.body}>
          <textarea value={f.values.body} onChange={(e) => f.set('body')(e.target.value)} style={{ minHeight: 200 }} />
        </Field>
        <Field label="Se puede abrir desde (opcional)" error={f.errors.unlockDate} help="Si lo dejás vacío, se puede leer ya.">
          <input type="date" value={f.values.unlockDate} onChange={(e) => f.set('unlockDate')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {letter && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((c) => ({ ...c, letters: removeById(c.letters, letter.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- sorpresas ----------
function Surprises({ author }: { author: boolean }) {
  const { surprises } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<Surprise | 'new' | null>(null);
  const [opened, setOpened] = useState<Surprise | null>(null);
  const sorted = [...surprises].sort((a, b) => a.unlockDate.localeCompare(b.unlockDate));
  const open = async (s: Surprise) => {
    if (!isUnlocked(s.unlockDate) && !author) return;
    if (!s.openedAt && isUnlocked(s.unlockDate) && !author) await upd((c) => ({ ...c, surprises: upsert(c.surprises, { ...s, openedAt: Date.now() }) }));
    setOpened(s);
  };
  return (
    <div>
      {author && (
        <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
          + Programar sorpresa
        </button>
      )}
      {sorted.length === 0 ? (
        <Empty title="No hay sorpresas programadas" text={author ? 'Programá una sorpresa para una fecha especial.' : 'Quién sabe qué aparecerá aquí… 👀'} />
      ) : (
        <div className="grid2">
          {sorted.map((s) => {
            const unlocked = isUnlocked(s.unlockDate);
            return (
              <div key={s.id} className={`gift ${unlocked ? 'ready' : ''} ${s.openedAt ? 'opened' : ''}`} data-testid="surprise">
                <div className="gift-box" aria-hidden="true">
                  {unlocked ? (s.openedAt ? '💝' : '🎁') : '🔒'}
                </div>
                <div className="small" style={{ fontWeight: 700 }}>
                  {unlocked || author ? s.title : 'Sorpresa'}
                </div>
                <div className="tiny muted">{unlocked ? formatKey(s.unlockDate) : `Se abre ${countdownText(s.unlockDate)}`}</div>
                {(unlocked || author) && (
                  <button className="btn sm rose" style={{ marginTop: 6 }} onClick={() => open(s)}>
                    {unlocked ? (s.openedAt ? 'Ver de nuevo' : 'Abrir') : 'Vista previa'}
                  </button>
                )}
                {author && (
                  <button className="btn sm ghost" onClick={() => setEdit(s)}>
                    Editar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {opened && (
        <Modal title={opened.title} onClose={() => setOpened(null)}>
          <div className="reveal" data-testid="surprise-content">
            <div className="confetti" aria-hidden="true">
              ✨ 💜 🌸 ⭐ 💗 ✨
            </div>
            {opened.imageId && <MediaImg id={opened.imageId} alt={opened.title} className="photo-large" />}
            <p className="pre serif" style={{ fontSize: '1.1rem' }}>
              {opened.message}
            </p>
          </div>
        </Modal>
      )}
      {edit && <SurpriseForm s={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function SurpriseForm({ s, onClose }: { s: Surprise | null; onClose: () => void }) {
  const f = useForm({ title: s?.title ?? '', message: s?.message ?? '', unlockDate: s?.unlockDate ?? '', imageId: s?.imageId ?? (null as string | null) });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 80 },
      message: { label: 'El mensaje', required: true, max: 10000 },
      unlockDate: { label: 'La fecha de apertura', required: true, date: true },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    if (s?.imageId && s.imageId !== f.values.imageId) await deleteMedia(s.imageId);
    await upd((c) => ({
      ...c,
      surprises: upsert(c.surprises, { id: s?.id ?? newId(), openedAt: s?.openedAt ?? null, ...f.values, title: f.values.title.trim() }),
    }));
    toast('Sorpresa programada 🎁');
    onClose();
  };
  return (
    <Modal title={s ? 'Editar sorpresa' : 'Nueva sorpresa'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title} help="Se muestra cuando ya se puede abrir.">
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Se abre el" error={f.errors.unlockDate}>
          <input type="date" value={f.values.unlockDate} onChange={(e) => f.set('unlockDate')(e.target.value)} />
        </Field>
        <Field label="Mensaje" error={f.errors.message}>
          <textarea value={f.values.message} onChange={(e) => f.set('message')(e.target.value)} />
        </Field>
        <ImagePicker label="Imagen" value={f.values.imageId} onChange={f.set('imageId')} />
        <FormActions onCancel={onClose} />
        {s && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await deleteMedia(s.imageId);
                await upd((c) => ({ ...c, surprises: removeById(c.surprises, s.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- mensajes por ocasión ----------
const OCCASION_SUGGESTIONS = [
  'Cuando estés triste',
  'Cuando me extrañes',
  'Antes de un examen o día difícil',
  'Cuando no puedas dormir',
  'Para tu cumpleaños',
  'Un día cualquiera',
];

function Occasions({ author }: { author: boolean }) {
  const { occasions } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<OccasionMessage | 'new' | null>(null);
  const [reading, setReading] = useState<OccasionMessage | null>(null);
  const groups = useMemo(() => [...new Set(occasions.map((o) => o.occasion))], [occasions]);
  return (
    <div>
      {author && (
        <button className="btn block" style={{ marginBottom: 12 }} onClick={() => setEdit('new')}>
          + Mensaje para una ocasión
        </button>
      )}
      {occasions.length === 0 ? (
        <Empty title="Sin mensajes todavía" text={author ? 'Prepará mensajes para distintos momentos.' : undefined} />
      ) : (
        <div className="stack">
          {groups.map((g) => {
            const msgs = occasions.filter((o) => o.occasion === g);
            return (
              <div key={g} className="card butter">
                <h3 style={{ marginBottom: 8 }}>{g}</h3>
                <div className="row wrap">
                  {msgs.map((m, i) => (
                    <span key={m.id} className="row" style={{ gap: 2 }}>
                      <button className="btn sm" onClick={() => setReading(m)}>
                        Abrir {msgs.length > 1 ? `#${i + 1}` : 'mensaje'}
                      </button>
                      {author && (
                        <button className="iconbtn" aria-label="Editar mensaje" onClick={() => setEdit(m)}>
                          <IconEdit />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {reading && (
        <Modal title={reading.occasion} onClose={() => setReading(null)}>
          <article className="letter-paper">
            <p className="pre serif">{reading.body}</p>
          </article>
        </Modal>
      )}
      {edit && <OccasionForm msg={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function OccasionForm({ msg, onClose }: { msg: OccasionMessage | null; onClose: () => void }) {
  const f = useForm({ occasion: msg?.occasion ?? '', body: msg?.body ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { occasion: { label: 'La ocasión', required: true, max: 80 }, body: { label: 'El mensaje', required: true, max: 10000 } });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    await upd((c) => ({ ...c, occasions: upsert(c.occasions, { id: msg?.id ?? newId(), occasion: f.values.occasion.trim(), body: f.values.body }) }));
    onClose();
  };
  return (
    <Modal title={msg ? 'Editar mensaje' : 'Nuevo mensaje'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Ocasión" error={f.errors.occasion}>
          <input value={f.values.occasion} onChange={(e) => f.set('occasion')(e.target.value)} list="occasions" placeholder="Elegí o escribí una" />
          <datalist id="occasions">
            {OCCASION_SUGGESTIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>
        <Field label="Mensaje" error={f.errors.body}>
          <textarea value={f.values.body} onChange={(e) => f.set('body')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {msg && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((c) => ({ ...c, occasions: removeById(c.occasions, msg.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- citas ----------
// Ideas genéricas inspiradas en situaciones típicas de los K-dramas (no en series concretas).
const PLAN_IDEAS: Array<Pick<DatePlan, 'title' | 'inspiration' | 'description'>> = [
  { title: 'Paraguas compartido', inspiration: 'La escena de lluvia', description: 'Salir a caminar un día de lluvia con un solo paraguas.' },
  { title: 'Picnic junto al río', inspiration: 'Tarde en el parque a orillas del río', description: 'Mantita, ramyeon instantáneo y atardecer.' },
  { title: 'Fotocabina', inspiration: 'Las tiras de fotos de las citas', description: 'Sacarnos fotos divertidas con accesorios y guardar la tira.' },
  { title: 'Cita en un café de gatos', inspiration: 'Cafés temáticos', description: 'Tomar algo rodeados de gatitos.' },
  { title: 'Mirador de noche', inspiration: 'Las luces de la ciudad desde lo alto', description: 'Subir a un lugar alto y mirar la ciudad iluminada.' },
  { title: 'Cocinar juntos', inspiration: 'La cena casera', description: 'Preparar kimbap o tteokbokki en casa.' },
  { title: 'Maratón de drama', inspiration: 'Noche de series con snacks', description: 'Elegir un drama con la ruleta y ver varios capítulos con snacks.' },
  { title: 'Bicicleta al atardecer', inspiration: 'Paseo en bici', description: 'Andar en bicicleta sin apuro hasta que se ponga el sol.' },
  { title: 'Cápsula del tiempo', inspiration: 'Cartas para el futuro', description: 'Escribirnos una carta para abrir dentro de un año.' },
  { title: 'Deseo de primera lluvia o frío', inspiration: 'La primera nevada', description: 'Pedir un deseo juntos el primer día frío o de lluvia de la temporada.' },
];

const PLAN_STATUS: Record<PlanStatus, string> = { idea: 'Idea', planeada: 'Planeada', hecha: 'Hecha 💜' };

function Plans() {
  const { plans } = useDoc(chapterDoc);
  const [edit, setEdit] = useState<DatePlan | 'new' | null>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const order: PlanStatus[] = ['planeada', 'idea', 'hecha'];
  const sorted = [...plans].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || (a.date ?? '').localeCompare(b.date ?? ''));
  const addIdea = async (idea: (typeof PLAN_IDEAS)[number]) => {
    await upd((c) => ({ ...c, plans: [...c.plans, { id: newId(), ...idea, date: null, status: 'idea' }] }));
    toast('Idea agregada a nuestros planes');
  };
  const cycle = (p: DatePlan) => {
    const next: PlanStatus = p.status === 'idea' ? 'planeada' : p.status === 'planeada' ? 'hecha' : 'idea';
    return upd((c) => ({ ...c, plans: upsert(c.plans, { ...p, status: next }) }));
  };
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn grow" onClick={() => setEdit('new')}>
          + Plan propio
        </button>
        <button className="btn secondary grow" onClick={() => setShowIdeas((v) => !v)}>
          {showIdeas ? 'Ocultar ideas' : 'Ver ideas'}
        </button>
      </div>
      {showIdeas && (
        <div className="card soft">
          <p className="small muted">Ideas inspiradas en momentos típicos de los K-dramas. Tocá para sumarlas.</p>
          {PLAN_IDEAS.map((i) => (
            <button key={i.title} className="item" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => addIdea(i)}>
              <div className="grow">
                <div className="title">{i.title}</div>
                <div className="small muted">{i.description}</div>
              </div>
              <span aria-hidden="true">＋</span>
            </button>
          ))}
        </div>
      )}
      {sorted.length === 0 ? (
        <Empty title="Sin planes todavía" text="Sumá ideas de citas y marcá las que ya hicimos." />
      ) : (
        sorted.map((p) => (
          <div className="item" key={p.id} data-testid="plan">
            <div className="grow">
              <div className="title">{p.title}</div>
              {p.inspiration && <div className="tiny muted">Inspiración: {p.inspiration}</div>}
              {p.description && <div className="small pre">{p.description}</div>}
              {p.date && <span className="tag butter">{formatKey(p.date)}</span>}
            </div>
            <button className={`btn sm ${p.status === 'hecha' ? 'secondary' : p.status === 'planeada' ? 'rose' : ''}`} onClick={() => cycle(p)} aria-label={`Estado: ${PLAN_STATUS[p.status]}. Tocar para cambiar.`}>
              {PLAN_STATUS[p.status]}
            </button>
            <button className="iconbtn" aria-label="Editar plan" onClick={() => setEdit(p)}>
              <IconEdit />
            </button>
          </div>
        ))
      )}
      {edit && <PlanForm plan={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function PlanForm({ plan, onClose }: { plan: DatePlan | null; onClose: () => void }) {
  const f = useForm({
    title: plan?.title ?? '',
    inspiration: plan?.inspiration ?? '',
    description: plan?.description ?? '',
    date: plan?.date ?? '',
    status: plan?.status ?? ('idea' as PlanStatus),
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 100 },
      inspiration: { label: 'Inspiración', max: 150 },
      description: { label: 'Descripción', max: 2000 },
      date: { label: 'Fecha', date: true },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    await upd((c) => ({ ...c, plans: upsert(c.plans, { id: plan?.id ?? newId(), ...f.values, title: f.values.title.trim(), date: f.values.date || null }) }));
    onClose();
  };
  return (
    <Modal title={plan ? 'Editar plan' : 'Nuevo plan'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Inspiración (opcional)" error={f.errors.inspiration} help="Ej.: una escena que nos gustó">
          <input value={f.values.inspiration} onChange={(e) => f.set('inspiration')(e.target.value)} />
        </Field>
        <Field label="Descripción (opcional)" error={f.errors.description}>
          <textarea value={f.values.description} onChange={(e) => f.set('description')(e.target.value)} />
        </Field>
        <Field label="Fecha (opcional)" error={f.errors.date}>
          <input type="date" value={f.values.date} onChange={(e) => f.set('date')(e.target.value)} />
        </Field>
        <Field label="Estado">
          <select value={f.values.status} onChange={(e) => f.set('status')(e.target.value as PlanStatus)}>
            {Object.entries(PLAN_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <FormActions onCancel={onClose} />
        {plan && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((c) => ({ ...c, plans: removeById(c.plans, plan.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
