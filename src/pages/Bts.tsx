import { useRef, useState, type FormEvent } from 'react';
import { useDoc, upsert, removeById, newId } from '../lib/store';
import { btsDoc } from '../lib/docs';
import { validate, hasErrors } from '../lib/validation';
import { formatKey } from '../lib/dates';
import { deleteMedia } from '../lib/media';
import type { Album, FanList, FanMemory, FrameStyle, Member, Photocard, Song } from '../lib/types';
import {
  DeleteButton, Empty, Field, FormActions, ImagePicker, MediaImg, Modal, Tabs, toast, useForm,
} from '../components/ui';
import { IconDown, IconEdit, IconStar, IconUp } from '../components/icons';
import { Blossom, Star4, HeartDeco } from '../components/deco';
import { isYouTubeLink, musicSearchUrl } from '../lib/youtube';
import { playQueue, type Track } from '../lib/player';
import { saveImageFile } from '../lib/media';
import './bts.css';

type BtsTab = 'musica' | 'integrantes' | 'photocards' | 'recuerdos' | 'listas';

export function BtsPage() {
  const [tab, setTab] = useState<BtsTab>('musica');
  return (
    <div className="page">
      <p className="small muted" style={{ marginTop: 0 }}>
        Tu espacio de fan personal: todo lo que ves aquí lo agregás vos.
      </p>
      <Tabs<BtsTab>
        label="Secciones de BTS World"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'musica', label: 'Música' },
          { id: 'integrantes', label: 'Integrantes' },
          { id: 'photocards', label: 'Photocards' },
          { id: 'recuerdos', label: 'Recuerdos' },
          { id: 'listas', label: 'Listas' },
        ]}
      />
      {tab === 'musica' && <Music />}
      {tab === 'integrantes' && <Members />}
      {tab === 'photocards' && <Photocards />}
      {tab === 'recuerdos' && <Memories />}
      {tab === 'listas' && <Lists />}
    </div>
  );
}

function FavButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className={`iconbtn ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={onClick}>
      <IconStar filled={on} style={{ color: on ? '#e9c35a' : undefined }} />
    </button>
  );
}

const upd = (fn: (d: ReturnType<typeof btsDoc.get>) => ReturnType<typeof btsDoc.get>) => btsDoc.update(fn);

// ---------------- Música ----------------
function Music() {
  const { songs, albums } = useDoc(btsDoc);
  const [onlyFav, setOnlyFav] = useState(false);
  const [editSong, setEditSong] = useState<Song | 'new' | null>(null);
  const [editAlbum, setEditAlbum] = useState<Album | 'new' | null>(null);
  const shownSongs = songs.filter((s) => !onlyFav || s.favorite);
  const shownAlbums = albums.filter((a) => !onlyFav || a.favorite);
  const playable: Track[] = shownSongs
    .filter((s) => s.link && isYouTubeLink(s.link))
    .map((s) => ({ id: s.id, title: s.title, subtitle: s.album, link: s.link! }));
  const play = (songId?: string) => playQueue(playable, songId ? Math.max(0, playable.findIndex((t) => t.id === songId)) : 0);
  return (
    <div>
      <label className="check">
        <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /> Mostrar solo favoritos
      </label>
      <div className="section-title">
        <h2>Canciones</h2>
        <button className="btn sm" onClick={() => setEditSong('new')}>
          + Canción
        </button>
      </div>
      {playable.length > 0 && (
        <button className="btn rose block" style={{ marginBottom: 10 }} onClick={() => play()}>
          ▶ Reproducir {playable.length === 1 ? 'la canción' : `las ${playable.length} canciones`}
        </button>
      )}
      {shownSongs.length === 0 ? (
        <Empty title={onlyFav ? 'Sin canciones favoritas' : 'Todavía no hay canciones'} text="Agregá las canciones que más te gustan." />
      ) : (
        shownSongs.map((s) => (
          <div className="item" key={s.id} data-testid="song">
            {s.link && isYouTubeLink(s.link) ? (
              <button className="song-note play" onClick={() => play(s.id)} aria-label={`Reproducir ${s.title}`}>
                ▶
              </button>
            ) : (
              <span className="song-note" aria-hidden="true">
                ♪
              </span>
            )}
            <div className="grow">
              <div className="title">{s.title}</div>
              {s.album && <div className="small muted">{s.album}</div>}
              {s.note && <div className="small pre">{s.note}</div>}
            </div>
            <FavButton
              on={s.favorite}
              label="Favorita"
              onClick={() => upd((d) => ({ ...d, songs: upsert(d.songs, { ...s, favorite: !s.favorite }) }))}
            />
            <button className="iconbtn" aria-label="Editar" onClick={() => setEditSong(s)}>
              <IconEdit />
            </button>
          </div>
        ))
      )}

      <div className="section-title">
        <h2>Álbumes</h2>
        <button className="btn sm" onClick={() => setEditAlbum('new')}>
          + Álbum
        </button>
      </div>
      {shownAlbums.length === 0 ? (
        <Empty title={onlyFav ? 'Sin álbumes favoritos' : 'Todavía no hay álbumes'} text="Podés sumar una foto de tu propia copia como portada." />
      ) : (
        shownAlbums.map((a) => (
          <div className="item" key={a.id} data-testid="album">
            {a.coverId ? <MediaImg id={a.coverId} alt={a.title} className="thumb" /> : <div className="thumb album-ph" aria-hidden="true">💿</div>}
            <div className="grow">
              <div className="title">{a.title}</div>
              {a.year && <div className="small muted">{a.year}</div>}
              {a.note && <div className="small pre">{a.note}</div>}
            </div>
            <FavButton
              on={a.favorite}
              label="Favorito"
              onClick={() => upd((d) => ({ ...d, albums: upsert(d.albums, { ...a, favorite: !a.favorite }) }))}
            />
            <button className="iconbtn" aria-label="Editar" onClick={() => setEditAlbum(a)}>
              <IconEdit />
            </button>
          </div>
        ))
      )}
      {editSong && <SongForm song={editSong === 'new' ? null : editSong} onClose={() => setEditSong(null)} />}
      {editAlbum && <AlbumForm album={editAlbum === 'new' ? null : editAlbum} onClose={() => setEditAlbum(null)} />}
    </div>
  );
}

function SongForm({ song, onClose }: { song: Song | null; onClose: () => void }) {
  const albums = useDoc(btsDoc).albums;
  const f = useForm({
    title: song?.title ?? '',
    album: song?.album ?? '',
    link: song?.link ?? '',
    note: song?.note ?? '',
    favorite: song?.favorite ?? false,
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { title: { label: 'El título', required: true, max: 120 }, album: { label: 'Álbum', max: 120 }, note: { label: 'Nota', max: 1000 } });
    if (f.values.link.trim() && !isYouTubeLink(f.values.link)) errs.link = 'Pegá un enlace de YouTube o YouTube Music (ej.: https://music.youtube.com/watch?v=…).';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const item: Song = { id: song?.id ?? newId(), createdAt: song?.createdAt ?? Date.now(), ...f.values, title: f.values.title.trim(), link: f.values.link.trim() };
    await upd((d) => ({ ...d, songs: upsert(d.songs, item) }));
    toast(song ? 'Canción actualizada' : 'Canción agregada 🎶');
    onClose();
  };
  return (
    <Modal title={song ? 'Editar canción' : 'Nueva canción'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Álbum (opcional)" error={f.errors.album}>
          <input value={f.values.album} onChange={(e) => f.set('album')(e.target.value)} list="album-names" />
          <datalist id="album-names">
            {albums.map((a) => (
              <option key={a.id} value={a.title} />
            ))}
          </datalist>
        </Field>
        <Field
          label="Enlace de YouTube Music o YouTube (opcional)"
          error={f.errors.link}
          help="En YouTube Music: ⋮ → Compartir → Copiar vínculo, y pegalo aquí para escucharla desde la app."
        >
          <input value={f.values.link} onChange={(e) => f.set('link')(e.target.value)} inputMode="url" placeholder="https://music.youtube.com/watch?v=…" />
        </Field>
        {f.values.title.trim() && (
          <a className="btn ghost sm" href={musicSearchUrl(`BTS ${f.values.title}`)} target="_blank" rel="noreferrer" style={{ marginTop: -6, marginBottom: 10 }}>
            🔎 Buscar "{f.values.title.trim()}" en YouTube Music
          </a>
        )}
        <Field label="¿Por qué te gusta? (opcional)" error={f.errors.note} help="Escribí con tus palabras; no hace falta copiar letras.">
          <textarea value={f.values.note} onChange={(e) => f.set('note')(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.values.favorite} onChange={(e) => f.set('favorite')(e.target.checked)} /> Favorita
        </label>
        <FormActions onCancel={onClose} />
        {song && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((d) => ({ ...d, songs: removeById(d.songs, song.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

function AlbumForm({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const f = useForm({
    title: album?.title ?? '',
    year: album?.year ?? '',
    note: album?.note ?? '',
    coverId: album?.coverId ?? (null as string | null),
    favorite: album?.favorite ?? false,
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { title: { label: 'El título', required: true, max: 120 }, note: { label: 'Nota', max: 1000 } });
    if (f.values.year && !/^\d{4}$/.test(f.values.year)) errs.year = 'Año: usá 4 números (ej. 2020).';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    if (album?.coverId && album.coverId !== f.values.coverId) await deleteMedia(album.coverId);
    const item: Album = { id: album?.id ?? newId(), createdAt: album?.createdAt ?? Date.now(), ...f.values, title: f.values.title.trim() };
    await upd((d) => ({ ...d, albums: upsert(d.albums, item) }));
    toast(album ? 'Álbum actualizado' : 'Álbum agregado 💿');
    onClose();
  };
  return (
    <Modal title={album ? 'Editar álbum' : 'Nuevo álbum'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Año (opcional)" error={f.errors.year}>
          <input value={f.values.year} onChange={(e) => f.set('year')(e.target.value)} inputMode="numeric" maxLength={4} />
        </Field>
        <ImagePicker label="Portada (una foto tuya)" value={f.values.coverId} onChange={f.set('coverId')} />
        <Field label="Nota (opcional)" error={f.errors.note}>
          <textarea value={f.values.note} onChange={(e) => f.set('note')(e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.values.favorite} onChange={(e) => f.set('favorite')(e.target.checked)} /> Favorito
        </label>
        <FormActions onCancel={onClose} />
        {album && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await deleteMedia(album.coverId);
                await upd((d) => ({ ...d, albums: removeById(d.albums, album.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------------- Integrantes ----------------
function Members() {
  const { members } = useDoc(btsDoc);
  const [edit, setEdit] = useState<Member | 'new' | null>(null);
  const [gallery, setGallery] = useState<string | null>(null);
  const galleryMember = members.find((m) => m.id === gallery) ?? null;
  const move = (i: number, dir: -1 | 1) =>
    upd((d) => {
      const arr = d.members.slice();
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, members: arr };
    });
  const favs = members.filter((m) => m.favorite);
  return (
    <div>
      <p className="small muted">
        Marcá tus favoritos con la estrella, ordenalos con las flechas y tocá un nombre para ver y subir tus fotos favoritas.
      </p>
      {favs.length > 0 && (
        <div className="card rose" style={{ padding: 12 }}>
          <span className="tiny muted">Mis favoritos</span>
          <div className="chips" style={{ marginTop: 4 }} data-testid="fav-members">
            {favs.map((m) => (
              <span key={m.id} className="tag rose" style={{ fontSize: '0.9rem' }}>
                💜 {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
      {members.length === 0 && <Empty title="Sin integrantes" />}
      {members.map((m, i) => (
        <div className="item" key={m.id} style={{ alignItems: 'center' }} data-testid="member">
          <span className="rank">{i + 1}</span>
          <button className="member-open grow" onClick={() => setGallery(m.id)} aria-label={`Fotos de ${m.name}`}>
            {m.avatarId ? <MediaImg id={m.avatarId} alt="" className="avatar" /> : <span className="avatar">{m.name.slice(0, 1)}</span>}
            <span style={{ minWidth: 0 }}>
              <span className="title" style={{ display: 'block' }}>
                {m.name}
              </span>
              <span className="tiny muted">
                {(m.photos ?? []).length} {(m.photos ?? []).length === 1 ? 'foto' : 'fotos'}
                {m.note ? ` · ${m.note}` : ''}
              </span>
            </span>
          </button>
          <FavButton on={m.favorite} label={`Favorito: ${m.name}`} onClick={() => upd((d) => ({ ...d, members: upsert(d.members, { ...m, favorite: !m.favorite }) }))} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button className="iconbtn" style={{ height: 30 }} aria-label={`Subir ${m.name}`} onClick={() => move(i, -1)} disabled={i === 0}>
              <IconUp />
            </button>
            <button className="iconbtn" style={{ height: 30 }} aria-label={`Bajar ${m.name}`} onClick={() => move(i, 1)} disabled={i === members.length - 1}>
              <IconDown />
            </button>
          </div>
          <button className="iconbtn" aria-label={`Editar ${m.name}`} onClick={() => setEdit(m)}>
            <IconEdit />
          </button>
        </div>
      ))}
      <button className="btn secondary block" onClick={() => setEdit('new')}>
        + Agregar otro nombre
      </button>
      {edit && <MemberForm member={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      {galleryMember && <MemberGallery member={galleryMember} onClose={() => setGallery(null)} />}
    </div>
  );
}

const MAX_MEMBER_PHOTOS = 60;

/** Álbum de fotos favoritas de cada integrante: imágenes que ella sube desde su galería. */
function MemberGallery({ member, onClose }: { member: Member; onClose: () => void }) {
  const photos = member.photos ?? [];
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const save = (next: Member) => upd((d) => ({ ...d, members: upsert(d.members, next) }));
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_MEMBER_PHOTOS - photos.length;
    if (room <= 0) return toast(`Máximo ${MAX_MEMBER_PHOTOS} fotos por integrante.`, 'error');
    setBusy(true);
    const ids: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        ids.push(await saveImageFile(f));
      } catch (e) {
        toast(e instanceof Error ? e.message : 'No se pudo guardar una imagen.', 'error');
      }
    }
    if (ids.length) {
      const cur = btsDoc.get().members.find((x) => x.id === member.id) ?? member;
      await save({ ...cur, photos: [...ids, ...(cur.photos ?? [])], avatarId: cur.avatarId ?? ids[0] });
      toast(ids.length === 1 ? 'Foto guardada 💜' : `${ids.length} fotos guardadas 💜`);
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  };
  const remove = async (id: string) => {
    await deleteMedia(id);
    await save({ ...member, photos: photos.filter((p) => p !== id), avatarId: member.avatarId === id ? null : member.avatarId });
    setView(null);
  };
  return (
    <Modal title={`Fotos de ${member.name}`} onClose={onClose}>
      <button className="btn block" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? 'Guardando…' : '+ Subir fotos'}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-testid="member-photos-input"
        aria-label={`Subir fotos de ${member.name}`}
        onChange={(e) => add(e.target.files)}
      />
      <p className="tiny muted center" style={{ margin: '6px 0 12px' }}>
        Se guardan cifradas solo en este dispositivo (y en tus copias de seguridad).
      </p>
      {photos.length === 0 ? (
        <Empty title="Todavía no hay fotos" text="Subí tus fotos favoritas desde la galería del teléfono." />
      ) : (
        <div className="member-grid" data-testid="member-photos">
          {photos.map((id) => (
            <button key={id} onClick={() => setView(id)} aria-label="Ver foto">
              <MediaImg id={id} alt={member.name} />
              {member.avatarId === id && <span className="pc-fav">★</span>}
            </button>
          ))}
        </div>
      )}
      {view && (
        <div className="card" style={{ marginTop: 12 }}>
          <MediaImg id={view} alt={member.name} className="photo-large" style={{ width: '100%', borderRadius: 14, display: 'block' }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn secondary sm grow" onClick={() => save({ ...member, avatarId: view }).then(() => toast('Foto de perfil actualizada'))}>
              Usar de perfil
            </button>
            <DeleteButton label="Eliminar foto" onConfirm={() => remove(view)} />
            <button className="btn ghost sm" onClick={() => setView(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MemberForm({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const f = useForm({ name: member?.name ?? '', note: member?.note ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { name: { label: 'El nombre', required: true, max: 40 }, note: { label: 'Nota', max: 500 } });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const item: Member = { ...member, id: member?.id ?? newId(), favorite: member?.favorite ?? false, name: f.values.name.trim(), note: f.values.note };
    await upd((d) => ({ ...d, members: member ? upsert(d.members, item) : [...d.members, item] }));
    onClose();
  };
  return (
    <Modal title={member ? 'Editar' : 'Agregar'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Nombre" error={f.errors.name}>
          <input value={f.values.name} onChange={(e) => f.set('name')(e.target.value)} />
        </Field>
        <Field label="Nota personal (opcional)" error={f.errors.note}>
          <textarea value={f.values.note} onChange={(e) => f.set('note')(e.target.value)} placeholder="Lo que más te gusta, un recuerdo…" />
        </Field>
        <FormActions onCancel={onClose} />
        {member && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((d) => ({ ...d, members: removeById(d.members, member.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------------- Photocards ----------------
const FRAMES: Array<{ id: FrameStyle; label: string }> = [
  { id: 'estrellas', label: 'Estrellas' },
  { id: 'cerezo', label: 'Cerezo' },
  { id: 'encaje', label: 'Encaje' },
  { id: 'holo', label: 'Holográfico' },
  { id: 'polaroid', label: 'Polaroid' },
];

export function PhotocardView({ pc, large }: { pc: Pick<Photocard, 'imageId' | 'caption' | 'frame' | 'member'>; large?: boolean }) {
  return (
    <figure className={`pc pc-${pc.frame} ${large ? 'pc-large' : ''}`}>
      <div className="pc-img">
        <MediaImg id={pc.imageId} alt={pc.caption || 'Photocard'} />
      </div>
      {pc.frame === 'estrellas' && (
        <>
          <Star4 size={large ? 26 : 16} style={{ position: 'absolute', top: 6, right: 6 }} />
          <Star4 size={large ? 18 : 11} color="#fff" style={{ position: 'absolute', bottom: 34, left: 8 }} />
        </>
      )}
      {pc.frame === 'cerezo' && (
        <>
          <Blossom size={large ? 34 : 22} style={{ position: 'absolute', top: -6, left: -6 }} />
          <Blossom size={large ? 24 : 15} style={{ position: 'absolute', bottom: 30, right: -4 }} />
        </>
      )}
      {pc.frame === 'encaje' && <HeartDeco size={large ? 22 : 14} color="#c97f9c" style={{ position: 'absolute', top: 8, right: 8 }} />}
      <figcaption>
        {pc.member && <strong>{pc.member}</strong>}
        {pc.member && pc.caption ? ' · ' : ''}
        {pc.caption}
      </figcaption>
    </figure>
  );
}

function Photocards() {
  const { photocards } = useDoc(btsDoc);
  const [collection, setCollection] = useState('');
  const [edit, setEdit] = useState<Photocard | 'new' | null>(null);
  const [view, setView] = useState<Photocard | null>(null);
  const collections = [...new Set(photocards.map((p) => p.collection).filter(Boolean))].sort();
  const shown = photocards.filter((p) => !collection || p.collection === collection || (collection === '★' && p.favorite));
  return (
    <div>
      <div className="row spread" style={{ marginBottom: 8 }}>
        <span className="small muted">{photocards.length} photocards</span>
        <button className="btn sm" onClick={() => setEdit('new')}>
          + Photocard
        </button>
      </div>
      {photocards.length > 0 && (
        <div className="chips" style={{ marginBottom: 12 }}>
          <button className="chip" aria-pressed={collection === ''} onClick={() => setCollection('')}>
            Todas
          </button>
          <button className="chip" aria-pressed={collection === '★'} onClick={() => setCollection('★')}>
            ★ Favoritas
          </button>
          {collections.map((c) => (
            <button key={c} className="chip" aria-pressed={collection === c} onClick={() => setCollection(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <Empty title="Tu carpeta de photocards está vacía" text="Subí tus fotos y elegí un marco para crear tu colección digital." />
      ) : (
        <div className="pc-grid">
          {shown.map((p) => (
            <button key={p.id} className="pc-btn" onClick={() => setView(p)} aria-label={`Ver photocard ${p.caption || p.member}`}>
              <PhotocardView pc={p} />
              {p.favorite && <span className="pc-fav">★</span>}
            </button>
          ))}
        </div>
      )}
      {view && (
        <Modal title={view.collection || 'Photocard'} onClose={() => setView(null)}>
          <div className="center">
            <PhotocardView pc={view} large />
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn secondary grow"
              onClick={async () => {
                const next = { ...view, favorite: !view.favorite };
                await upd((d) => ({ ...d, photocards: upsert(d.photocards, next) }));
                setView(next);
              }}
            >
              {view.favorite ? '★ Quitar de favoritas' : '☆ Favorita'}
            </button>
            <button
              className="btn grow"
              onClick={() => {
                setEdit(view);
                setView(null);
              }}
            >
              Editar
            </button>
          </div>
        </Modal>
      )}
      {edit && <PhotocardForm pc={edit === 'new' ? null : edit} collections={collections} onClose={() => setEdit(null)} />}
    </div>
  );
}

function PhotocardForm({ pc, collections, onClose }: { pc: Photocard | null; collections: string[]; onClose: () => void }) {
  const { members } = useDoc(btsDoc);
  const f = useForm({
    imageId: pc?.imageId ?? (null as string | null),
    caption: pc?.caption ?? '',
    member: pc?.member ?? '',
    collection: pc?.collection ?? '',
    frame: pc?.frame ?? ('estrellas' as FrameStyle),
    favorite: pc?.favorite ?? false,
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, { caption: { label: 'Texto', max: 80 }, collection: { label: 'Colección', max: 40 } });
    if (!f.values.imageId) errs.imageId = 'Elegí una imagen.';
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    if (pc && pc.imageId !== f.values.imageId) await deleteMedia(pc.imageId);
    const item: Photocard = {
      id: pc?.id ?? newId(),
      createdAt: pc?.createdAt ?? Date.now(),
      ...f.values,
      imageId: f.values.imageId!,
      collection: f.values.collection.trim(),
    };
    await upd((d) => ({ ...d, photocards: upsert(d.photocards, item) }));
    toast(pc ? 'Photocard actualizada' : 'Photocard creada ✨');
    onClose();
  };
  return (
    <Modal title={pc ? 'Editar photocard' : 'Nueva photocard'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <ImagePicker label="Imagen" required value={f.values.imageId} onChange={f.set('imageId')} error={f.errors.imageId} />
        {f.values.imageId && (
          <div className="center" style={{ marginBottom: 12 }}>
            <PhotocardView pc={{ imageId: f.values.imageId, caption: f.values.caption, frame: f.values.frame, member: f.values.member }} />
          </div>
        )}
        <div className="field">
          <span className="field-label">Marco</span>
          <div className="chips">
            {FRAMES.map((fr) => (
              <button key={fr.id} type="button" className="chip" aria-pressed={f.values.frame === fr.id} onClick={() => f.set('frame')(fr.id)}>
                {fr.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Integrante (opcional)">
          <select value={f.values.member} onChange={(e) => f.set('member')(e.target.value)}>
            <option value="">—</option>
            <option value="Grupo">Grupo</option>
            {members.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Texto (opcional)" error={f.errors.caption}>
          <input value={f.values.caption} onChange={(e) => f.set('caption')(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Colección (opcional)" error={f.errors.collection} help="Ej.: Mi carpeta lavanda, Concierto, Favoritas 2026">
          <input value={f.values.collection} onChange={(e) => f.set('collection')(e.target.value)} list="pc-collections" />
          <datalist id="pc-collections">
            {collections.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.values.favorite} onChange={(e) => f.set('favorite')(e.target.checked)} /> Favorita
        </label>
        <FormActions onCancel={onClose} />
        {pc && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await deleteMedia(pc.imageId);
                await upd((d) => ({ ...d, photocards: removeById(d.photocards, pc.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------------- Recuerdos ----------------
function Memories() {
  const { memories } = useDoc(btsDoc);
  const [edit, setEdit] = useState<FanMemory | 'new' | null>(null);
  const sorted = [...memories].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);
  return (
    <div>
      <div className="row spread" style={{ marginBottom: 8 }}>
        <span className="small muted">Conciertos, estrenos, días especiales…</span>
        <button className="btn sm" onClick={() => setEdit('new')}>
          + Recuerdo
        </button>
      </div>
      {sorted.length === 0 ? (
        <Empty title="Sin recuerdos todavía" text="Guardá fechas y notas de tus momentos como fan." />
      ) : (
        sorted.map((m) => (
          <div className="item" key={m.id}>
            <div className="date-pill">{m.date ? formatKey(m.date) : 'Sin fecha'}</div>
            <div className="grow">
              <div className="title">{m.title}</div>
              {m.note && <div className="small pre">{m.note}</div>}
            </div>
            <button className="iconbtn" aria-label="Editar" onClick={() => setEdit(m)}>
              <IconEdit />
            </button>
          </div>
        ))
      )}
      {edit && <MemoryForm memory={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function MemoryForm({ memory, onClose }: { memory: FanMemory | null; onClose: () => void }) {
  const f = useForm({ title: memory?.title ?? '', date: memory?.date ?? '', note: memory?.note ?? '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f.values, {
      title: { label: 'El título', required: true, max: 120 },
      date: { label: 'Fecha', date: true },
      note: { label: 'Nota', max: 3000 },
    });
    f.setErrors(errs);
    if (hasErrors(errs)) return;
    const item: FanMemory = { id: memory?.id ?? newId(), createdAt: memory?.createdAt ?? Date.now(), ...f.values, title: f.values.title.trim() };
    await upd((d) => ({ ...d, memories: upsert(d.memories, item) }));
    onClose();
  };
  return (
    <Modal title={memory ? 'Editar recuerdo' : 'Nuevo recuerdo'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Título" error={f.errors.title}>
          <input value={f.values.title} onChange={(e) => f.set('title')(e.target.value)} />
        </Field>
        <Field label="Fecha (opcional)" error={f.errors.date}>
          <input type="date" value={f.values.date} onChange={(e) => f.set('date')(e.target.value)} />
        </Field>
        <Field label="Notas (opcional)" error={f.errors.note}>
          <textarea value={f.values.note} onChange={(e) => f.set('note')(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} />
        {memory && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <DeleteButton
              onConfirm={async () => {
                await upd((d) => ({ ...d, memories: removeById(d.memories, memory.id) }));
                onClose();
              }}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------------- Listas ----------------
function Lists() {
  const { lists } = useDoc(btsDoc);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setErr('Escribí un nombre para la lista.');
    if (n.length > 60) return setErr('Máximo 60 caracteres.');
    await upd((d) => ({ ...d, lists: [{ id: newId(), name: n, items: [], createdAt: Date.now() }, ...d.lists] }));
    setName('');
    setErr('');
  };
  return (
    <div>
      <form onSubmit={add} className="row" style={{ alignItems: 'flex-start' }} noValidate>
        <div className="grow">
          <Field label="Nueva lista" error={err}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Canciones para estudiar" />
          </Field>
        </div>
        <button className="btn" style={{ marginTop: 26 }}>
          Crear
        </button>
      </form>
      {lists.length === 0 ? <Empty title="Sin listas" text="Armá listas personales: playlists, deseos, merch, lo que quieras." /> : lists.map((l) => <ListCard key={l.id} list={l} />)}
    </div>
  );
}

function ListCard({ list }: { list: FanList }) {
  const [text, setText] = useState('');
  const save = (next: FanList) => upd((d) => ({ ...d, lists: upsert(d.lists, next) }));
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    await save({ ...list, items: [...list.items, { id: newId(), text: t.slice(0, 200), favorite: false, done: false }] });
    setText('');
  };
  return (
    <div className="card" data-testid="fan-list">
      <div className="row spread">
        <h3 style={{ margin: 0 }}>{list.name}</h3>
        <DeleteButton label="Eliminar lista" onConfirm={() => upd((d) => ({ ...d, lists: removeById(d.lists, list.id) }))} />
      </div>
      {list.items.length === 0 && <p className="small muted">Lista vacía.</p>}
      {list.items.map((it) => (
        <div key={it.id} className="row" style={{ borderBottom: '1px dashed var(--lavender-soft)' }}>
          <label className="check grow">
            <input
              type="checkbox"
              checked={it.done}
              onChange={() => save({ ...list, items: list.items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)) })}
            />
            <span style={{ textDecoration: it.done ? 'line-through' : 'none', fontWeight: 600 }}>{it.text}</span>
          </label>
          <FavButton on={it.favorite} label="Favorito" onClick={() => save({ ...list, items: list.items.map((x) => (x.id === it.id ? { ...x, favorite: !x.favorite } : x)) })} />
          <DeleteButton label="Quitar" onConfirm={() => save({ ...list, items: list.items.filter((x) => x.id !== it.id) })} />
        </div>
      ))}
      <form onSubmit={add} className="row" style={{ marginTop: 10 }}>
        <input className="input grow" value={text} onChange={(e) => setText(e.target.value)} placeholder="Agregar elemento…" aria-label={`Agregar a ${list.name}`} />
        <button className="btn sm">Agregar</button>
      </form>
    </div>
  );
}
