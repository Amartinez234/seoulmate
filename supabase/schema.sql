-- Seoulmate: esquema opcional para sincronizar entre dispositivos.
-- Ejecutar en Supabase > SQL Editor. Todo el contenido llega ya cifrado desde el teléfono;
-- además, Row Level Security garantiza que cada cuenta solo vea y modifique sus propias filas.

create table if not exists public.seoulmate_sync_meta (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  salt text not null,
  iterations integer not null check (iterations >= 100000),
  check_iv text not null,
  check_ct text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.seoulmate_records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) <= 120),
  iv text not null,
  ct text not null,
  updated_at_ms bigint not null,
  primary key (user_id, name)
);

alter table public.seoulmate_sync_meta enable row level security;
alter table public.seoulmate_records enable row level security;

-- Sin acceso para usuarios anónimos.
revoke all on public.seoulmate_sync_meta from anon;
revoke all on public.seoulmate_records from anon;
grant select, insert, update, delete on public.seoulmate_sync_meta to authenticated;
grant select, insert, update, delete on public.seoulmate_records to authenticated;

drop policy if exists "meta: solo el dueño" on public.seoulmate_sync_meta;
create policy "meta: solo el dueño" on public.seoulmate_sync_meta
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "records: solo el dueño" on public.seoulmate_records;
create policy "records: solo el dueño" on public.seoulmate_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
