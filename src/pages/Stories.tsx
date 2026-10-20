// Biblioteca BL: sus historias favoritas de Wattpad (u otras webs), con progreso de lectura.
import { useMemo, useState, type FormEvent } from 'react';
import { useDoc, upsert, removeById, newId } from '../lib/store';
import {
  filterStories, isWattpad, progressText, safeLink, SHIPS, STORY_STATUS, STORY_TAGS, storiesDoc, wattpadSearchUrl,
  type Story, type StoryFilters, type StoryStatus,
} from '../lib/stories';
import { validate, hasErrors } from '../lib/validation';
import { Chips, DeleteButton, Empty, Field, FormActions, Modal, Stars, toast, useForm } from '../components/ui';
import './stories.css';

const save = (s: Story) => storiesDoc.update((x) => ({ ...x, stories: upsert(x.stories, { ...s, updatedAt: Date.now() }) }));

export function StoriesPage() {
  const { stories } = useDoc(storiesDoc);
  const [f, setF] = useState<StoryFilters>({ q: '', status: 'todas', ship: '', favorites: false });
  const [edit, setEdit] = useState<Story | 'new' | null>(null);
  const shown = useMemo(() => filterStories(stories, f), [stories, f]);
  const ships = [...new Set(stories.map((s) => s.ship).filter(Boolean))];
  const reading = stories.filter((s) => s.status === 'leyendo').length;

  return (
    <div className="page">
      <section className="card stories-hero">
        <div>
          <h2 style={{ margin: 0 }}>Mi biblioteca BL 📚</h2>
          <p className="small" style={{ margin: '4px 0 0' }}>
            {stories.length === 0 ? 'Guardá tus historias favoritas para no perderlas nunca.' : `${stories.length} historias · ${reading} leyendo ahora`}
          </p>
        </div>
        <button className="btn" onClick={() => setEdit('new')}>
          + Historia
        </button>
      </section>

      {stories.length > 0 && (
        <div className="stories-filters">
          <input className="input" placeholder="Buscar por título, autor, ship o etiqueta…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Buscar historias" />
          <div className="row wrap" style={{ gap: 6 }}>
            <select className="input sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as StoryFilters['status'] })} aria-label="Filtrar por estado">
              <option value="todas">Todas</option>
              {Object.entries(STORY_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            {ships.length > 0 && (
              <select className="input sm" value={f.ship} onChange={(e) => setF({ ...f, ship: e.target.value })} aria-label="Filtrar por ship">
                <option value="">Todos los ships</option>
                {ships.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
            <label className="check" style={{ margin: 0 }}>
              <input type="checkbox" checked={f.favorites} onChange={(e) => setF({ ...f, favorites: e.target.checked })} /> Solo favoritas
            </label>
          </div>
        </div>
      )}

      {stories.length === 0 ? (
        <Empty
          title="Tu biblioteca está vacía"
          text='Copiá el enlace de una historia en Wattpad (botón Compartir > Copiar enlace) y tocá "+ Historia".'
        />
      ) : shown.length === 0 ? (
        <Empty title="Sin resultados" />
      ) : (
        shown.map((s) => <StoryCard key={s.id} s={s} onEdit={() => setEdit(s)} />)
      )}
      {edit && <StoryForm story={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function StoryCard({ s, onEdit }: { s: Story; onEdit: () => void }) {
  const link = safeLink(s.link);
  const bump = (d: number) => {
    const chapter = Math.max(0, s.chapters ? Math.min(s.chapters, s.chapter + d) : s.chapter + d);
    const status: StoryStatus = s.chapters && chapter >= s.chapters ? 'terminada' : chapter > 0 && s.status === 'quiero' ? 'leyendo' : s.status;
    void save({ ...s, chapter, status });
    if (status === 'terminada' && s.status !== 'terminada') toast(`¡Terminaste "${s.title}"! 🎉`);
  };
  const pct = s.chapters ? Math.round((Math.min(s.chapter, s.chapters) / s.chapters) * 100) : 0;
  return (
    <article className={`card story ${s.favorite ? 'fav' : ''}`} data-testid="story">
      <button className="story-main" onClick={onEdit} aria-label={`Editar ${s.title}`}>
        <div className="row spread">
          <h3 style={{ margin: 0 }}>
            {s.favorite && <span aria-label="Favorita">💜 </span>}
            {s.title}
          </h3>
          <span className={`tag st-${s.status}`}>{STORY_STATUS[s.status]}</span>
        </div>
        <div className="small muted">
          {s.author && `por ${s.author}`}
          {s.author && s.ship && ' · '}
          {s.ship && <strong className="ship">{s.ship}</strong>}
        </div>
        {s.tags.length > 0 && (
          <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
            {s.tags.map((t) => (
              <span key={t} className="tag tiny-tag">
                {t}
              </span>
            ))}
          </div>
        )}
        {s.chapters > 0 && (
          <div className="story-bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        {s.rating > 0 && <Stars value={s.rating} />}
      </button>
      <div className="row spread" style={{ marginTop: 8 }}>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn ghost sm" onClick={() => bump(-1)} aria-label="Capítulo anterior" disabled={s.chapter <= 0}>
            −
          </button>
          <span className="small" data-testid="story-progress" style={{ minWidth: 80, textAlign: 'center' }}>
            {progressText(s) || 'Sin empezar'}
          </span>
          <button className="btn ghost sm" onClick={() => bump(1)} aria-label="Leí un capítulo más" disabled={!!s.chapters && s.chapter >= s.chapters}>
            +
          </button>
        </div>
        {link && (
          <a className="btn rose sm" href={link} target="_blank" rel="noreferrer">
            {isWattpad(link) ? 'Leer en Wattpad' : 'Abrir'}
          </a>
        )}
      </div>
    </article>
  );
}

function StoryForm({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const f = useForm({
    title: story?.title ?? '',
    author: story?.author ?? '',
    link: story?.link ?? '',
    ship: story?.ship ?? '',
    tags: story?.tags ?? ([] as string[]),
    status: story?.status ?? ('quiero' as StoryStatus),
    chapter: story?.chapter ?? 0,
    chapters: story?.chapters ?? 0,
    rating: story?.rating ?? 0,
    favorite: story?.favorite ?? false,
    notes: story?.notes ?? '',
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 150 },
      author: { label: 'Autor/a', max: 80 },
      ship: { label: 'Ship', max: 40 },
      notes: { label: 'Notas', max: 5000 },
      chapter: { label: 'Capítulo', min: 0, maxNum: 5000 },
      chapters: { label: 'Total de capítulos', min: 0, maxNum: 5000 },
    });
    if (f.values.link.trim() && !safeLink(f.values.link)) errs.link = 'Pegá un enlace que empiece con https://';
    if (f.values.chapters && f.values.chapter > f.values.chapters) errs.chapter = 'No puede ser mayor que el total.';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const now = Date.now();
    await save({
      id: story?.id ?? newId(),
      createdAt: story?.createdAt ?? now,
      updatedAt: now,
      ...f.values,
      title: f.values.title.trim(),
      author: f.values.author.trim(),
      ship: f.values.ship.trim(),
      link: f.values.link.trim() ? (safeLink(f.values.link) ?? '') : '',
    });
    toast(story ? 'Historia actualizada' : 'Historia guardada 📚');
    onClose();
  };
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Math.floor(Number(v))));
  return (
    <Modal title={story ? 'Editar historia' : 'Nueva historia'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Enlace (opcional)" error={f.errors.link} help="En Wattpad: Compartir > Copiar enlace, y pegalo acá.">
          <input value={f.values.link} onChange={(e) => f.set('link')(e.target.value)} inputMode="url" placeholder="https://www.wattpad.com/story/…" />
        </Field>
        {f.values.title.trim() && !f.values.link.trim() && (
          <a className="btn ghost sm" href={wattpadSearchUrl(f.values.title)} target="_blank" rel="noreferrer" style={{ marginBottom: 10 }}>
            Buscar "{f.values.title.trim()}" en Wattpad
          </a>
        )}
        <Field label="Autor/a (opcional)" error={f.errors.author}>
          <input value={f.values.author} onChange={(e) => f.set('author')(e.target.value)} />
        </Field>
        <Field label="Ship o pareja (opcional)" error={f.errors.ship}>
          <input value={f.values.ship} onChange={(e) => f.set('ship')(e.target.value)} list="ships" placeholder="Por ejemplo: Taekook" />
        </Field>
        <datalist id="ships">
          {SHIPS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="field">
          <span className="field-label">Etiquetas</span>
          <Chips options={STORY_TAGS} value={f.values.tags} onChange={f.set('tags')} />
        </div>
        <Field label="Estado">
          <select value={f.values.status} onChange={(e) => f.set('status')(e.target.value as StoryStatus)}>
            {Object.entries(STORY_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid2">
          <Field label="Voy por el capítulo" error={f.errors.chapter}>
            <input type="number" inputMode="numeric" min={0} value={f.values.chapter || ''} onChange={(e) => f.set('chapter')(num(e.target.value))} />
          </Field>
          <Field label="Total (si sabés)" error={f.errors.chapters}>
            <input type="number" inputMode="numeric" min={0} value={f.values.chapters || ''} onChange={(e) => f.set('chapters')(num(e.target.value))} />
          </Field>
        </div>
        <div className="field">
          <span className="field-label">Mi puntuación</span>
          <Stars value={f.values.rating} onChange={f.set('rating')} />
        </div>
        <label className="check">
          <input type="checkbox" checked={f.values.favorite} onChange={(e) => f.set('favorite')(e.target.checked)} /> Favorita 💜
        </label>
        <Field label="Notas (opcional)" error={f.errors.notes} help="Escenas favoritas, por qué te gustó, a quién se la recomendarías…">
          <textarea value={f.values.notes} onChange={(e) => f.set('notes')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {story && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await storiesDoc.update((x) => ({ ...x, stories: removeById(x.stories, story.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
