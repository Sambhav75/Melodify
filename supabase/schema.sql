-- =====================================================================
--  MELODIFY - Supabase / PostgreSQL schema
--
--  Paste this whole file into  Supabase Dashboard -> SQL Editor -> New query
--  and click RUN. It is idempotent, so running it again is safe.
--
--  Contents
--    1. Helper functions
--    2. Tables + indexes
--    3. Triggers (profile creation, role protection, updated_at)
--    4. Row Level Security policies
--    5. RPC functions used by the app
--    6. Storage buckets + storage policies
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. HELPERS
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- 2.1 profiles: one row per auth user --------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  email       text,
  avatar_url  text,
  role        text not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin')),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,30}$')
);

create unique index if not exists profiles_username_lower_key on public.profiles (lower(username));
create index if not exists profiles_role_idx on public.profiles (role);

-- is_admin() is used by almost every policy below. SECURITY DEFINER lets it read
-- the profiles table without triggering recursive RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- 2.2 artists ---------------------------------------------------------
create table if not exists public.artists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 200),
  image_url   text,
  biography   text,
  created_at  timestamptz not null default now()
);
create index if not exists artists_name_lower_idx on public.artists (lower(name));

-- 2.3 albums (album_type also covers singles and EPs) ----------------
create table if not exists public.albums (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  artist_id     uuid not null references public.artists (id) on delete cascade,
  cover_url     text,
  release_date  date,
  album_type    text not null default 'album',
  created_at    timestamptz not null default now(),
  constraint albums_type_check check (album_type in ('album', 'single', 'ep'))
);
create index if not exists albums_artist_id_idx on public.albums (artist_id);
create index if not exists albums_created_at_idx on public.albums (created_at desc);

-- 2.4 songs -----------------------------------------------------------
create table if not exists public.songs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  artist_id     uuid not null references public.artists (id) on delete cascade,
  album_id      uuid references public.albums (id) on delete set null,
  audio_url     text not null,
  cover_url     text,
  duration      integer not null default 0 check (duration >= 0),   -- seconds
  genre         text,
  release_date  date,
  track_number  integer,
  play_count    bigint not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists songs_artist_id_idx on public.songs (artist_id);
create index if not exists songs_album_track_idx on public.songs (album_id, track_number);
create index if not exists songs_genre_idx on public.songs (genre);
create index if not exists songs_created_at_idx on public.songs (created_at desc);
create index if not exists songs_play_count_idx on public.songs (play_count desc);

-- 2.5 playlists -------------------------------------------------------
create table if not exists public.playlists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 100),
  description  text,
  cover_image  text,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists playlists_user_created_idx on public.playlists (user_id, created_at desc);
create index if not exists playlists_public_idx on public.playlists (created_at desc) where is_public;

-- 2.6 playlist_songs (ordered by "position") --------------------------
create table if not exists public.playlist_songs (
  id           uuid primary key default gen_random_uuid(),
  playlist_id  uuid not null references public.playlists (id) on delete cascade,
  song_id      uuid not null references public.songs (id) on delete cascade,
  position     integer not null default 0,
  added_at     timestamptz not null default now(),
  constraint playlist_songs_unique unique (playlist_id, song_id)
);
create index if not exists playlist_songs_position_idx on public.playlist_songs (playlist_id, position);
create index if not exists playlist_songs_song_idx on public.playlist_songs (song_id);

-- 2.7 per-user library tables ----------------------------------------
create table if not exists public.liked_songs (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  song_id     uuid not null references public.songs (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, song_id)
);
create index if not exists liked_songs_user_created_idx on public.liked_songs (user_id, created_at desc);
create index if not exists liked_songs_song_idx on public.liked_songs (song_id);

create table if not exists public.followed_artists (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  artist_id   uuid not null references public.artists (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, artist_id)
);
create index if not exists followed_artists_user_created_idx on public.followed_artists (user_id, created_at desc);
create index if not exists followed_artists_artist_idx on public.followed_artists (artist_id);

create table if not exists public.saved_albums (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  album_id    uuid not null references public.albums (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, album_id)
);
create index if not exists saved_albums_user_created_idx on public.saved_albums (user_id, created_at desc);
create index if not exists saved_albums_album_idx on public.saved_albums (album_id);

create table if not exists public.liked_playlists (
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  playlist_id  uuid not null references public.playlists (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, playlist_id)
);
create index if not exists liked_playlists_user_created_idx on public.liked_playlists (user_id, created_at desc);
create index if not exists liked_playlists_playlist_idx on public.liked_playlists (playlist_id);

-- 2.8 recently_played: ONE row per (user, song); replays just bump played_at.
create table if not exists public.recently_played (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  song_id     uuid not null references public.songs (id) on delete cascade,
  played_at   timestamptz not null default now(),
  play_count  integer not null default 1,
  constraint recently_played_unique unique (user_id, song_id)
);
create index if not exists recently_played_user_played_idx on public.recently_played (user_id, played_at desc);
create index if not exists recently_played_song_idx on public.recently_played (song_id);

-- 2.9 optional: trigram indexes make "type-ahead" search fast on bigger catalogues.
-- Wrapped so a missing extension never aborts the rest of this script.
do $$
begin
  create extension if not exists pg_trgm with schema extensions;
  execute 'create index if not exists songs_title_trgm_idx on public.songs using gin (title extensions.gin_trgm_ops)';
  execute 'create index if not exists artists_name_trgm_idx on public.artists using gin (name extensions.gin_trgm_ops)';
  execute 'create index if not exists albums_title_trgm_idx on public.albums using gin (title extensions.gin_trgm_ops)';
  execute 'create index if not exists playlists_name_trgm_idx on public.playlists using gin (name extensions.gin_trgm_ops)';
exception when others then
  raise notice 'Skipping trigram indexes: %', sqlerrm;
end
$$;


-- ---------------------------------------------------------------------
-- 3. TRIGGERS
-- ---------------------------------------------------------------------

-- 3.1 keep updated_at fresh
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists playlists_set_updated_at on public.playlists;
create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

-- 3.2 create a profile automatically when somebody signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base     text;
  v_username text;
  v_attempt  integer := 0;
begin
  v_base := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  v_base := regexp_replace(v_base, '[^A-Za-z0-9_]', '', 'g');
  if char_length(v_base) < 3 then
    v_base := 'listener' || substr(md5(random()::text), 1, 4);
  end if;
  v_base := left(v_base, 20);
  v_username := v_base;

  while exists (select 1 from public.profiles where lower(username) = lower(v_username)) loop
    v_attempt := v_attempt + 1;
    v_username := v_base || '_' || substr(md5(random()::text), 1, least(3 + v_attempt, 8));
  end loop;

  insert into public.profiles (id, username, email, avatar_url)
  values (new.id, v_username, new.email, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.3 keep profiles.email in sync when a user changes their email
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- 3.4 only admins may change roles. (Statements run from the SQL editor or with the
--     service-role key have no auth.uid(), so you can still promote your first admin there.)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only administrators can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 3.5 back-fill profiles for users that existed before this script ran
insert into public.profiles (id, username, email)
select u.id, 'user_' || substr(replace(u.id::text, '-', ''), 1, 8), u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;


-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

-- 4.1 profiles: users see/edit only their own row. Admins see/edit all.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and role = 'user');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- 4.2 music catalogue: readable by everyone, writable by admins only
alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.songs enable row level security;

drop policy if exists "artists_public_read" on public.artists;
create policy "artists_public_read" on public.artists for select using (true);
drop policy if exists "artists_admin_insert" on public.artists;
create policy "artists_admin_insert" on public.artists for insert to authenticated with check (public.is_admin());
drop policy if exists "artists_admin_update" on public.artists;
create policy "artists_admin_update" on public.artists for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "artists_admin_delete" on public.artists;
create policy "artists_admin_delete" on public.artists for delete to authenticated using (public.is_admin());

drop policy if exists "albums_public_read" on public.albums;
create policy "albums_public_read" on public.albums for select using (true);
drop policy if exists "albums_admin_insert" on public.albums;
create policy "albums_admin_insert" on public.albums for insert to authenticated with check (public.is_admin());
drop policy if exists "albums_admin_update" on public.albums;
create policy "albums_admin_update" on public.albums for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "albums_admin_delete" on public.albums;
create policy "albums_admin_delete" on public.albums for delete to authenticated using (public.is_admin());

drop policy if exists "songs_public_read" on public.songs;
create policy "songs_public_read" on public.songs for select using (true);
drop policy if exists "songs_admin_insert" on public.songs;
create policy "songs_admin_insert" on public.songs for insert to authenticated with check (public.is_admin());
drop policy if exists "songs_admin_update" on public.songs;
create policy "songs_admin_update" on public.songs for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "songs_admin_delete" on public.songs;
create policy "songs_admin_delete" on public.songs for delete to authenticated using (public.is_admin());

-- 4.3 playlists: public ones are readable by all, private ones only by the owner (and admins)
alter table public.playlists enable row level security;

drop policy if exists "playlists_select_visible" on public.playlists;
create policy "playlists_select_visible" on public.playlists
  for select
  using (is_public or user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "playlists_insert_own" on public.playlists;
create policy "playlists_insert_own" on public.playlists
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "playlists_update_own_or_admin" on public.playlists;
create policy "playlists_update_own_or_admin" on public.playlists
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "playlists_delete_own_or_admin" on public.playlists;
create policy "playlists_delete_own_or_admin" on public.playlists
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- 4.4 playlist_songs: follows the visibility / ownership of the parent playlist
alter table public.playlist_songs enable row level security;

drop policy if exists "playlist_songs_select_visible" on public.playlist_songs;
create policy "playlist_songs_select_visible" on public.playlist_songs
  for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_songs.playlist_id
        and (p.is_public or p.user_id = (select auth.uid()) or public.is_admin())
    )
  );

drop policy if exists "playlist_songs_insert_owner" on public.playlist_songs;
create policy "playlist_songs_insert_owner" on public.playlist_songs
  for insert to authenticated
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_songs.playlist_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "playlist_songs_update_owner" on public.playlist_songs;
create policy "playlist_songs_update_owner" on public.playlist_songs
  for update to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_songs.playlist_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_songs.playlist_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "playlist_songs_delete_owner_or_admin" on public.playlist_songs;
create policy "playlist_songs_delete_owner_or_admin" on public.playlist_songs
  for delete to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_songs.playlist_id
        and (p.user_id = (select auth.uid()) or public.is_admin())
    )
  );

-- 4.5 personal library tables: each user manages only their own rows
alter table public.liked_songs enable row level security;
alter table public.followed_artists enable row level security;
alter table public.saved_albums enable row level security;
alter table public.liked_playlists enable row level security;
alter table public.recently_played enable row level security;

drop policy if exists "liked_songs_own" on public.liked_songs;
create policy "liked_songs_own" on public.liked_songs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "followed_artists_own" on public.followed_artists;
create policy "followed_artists_own" on public.followed_artists
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "saved_albums_own" on public.saved_albums;
create policy "saved_albums_own" on public.saved_albums
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "liked_playlists_own" on public.liked_playlists;
create policy "liked_playlists_own" on public.liked_playlists
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "recently_played_own" on public.recently_played;
create policy "recently_played_own" on public.recently_played
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 5. RPC FUNCTIONS
-- ---------------------------------------------------------------------

-- 5.1 record_play: upsert into recently_played (no duplicates), bump the global
--     play counter and trim each user's history to the 50 most recent songs.
create or replace function public.record_play(p_song_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return;
  end if;

  insert into public.recently_played (user_id, song_id, played_at, play_count)
  values (v_user, p_song_id, now(), 1)
  on conflict (user_id, song_id)
  do update set played_at = now(), play_count = public.recently_played.play_count + 1;

  update public.songs set play_count = play_count + 1 where id = p_song_id;

  delete from public.recently_played
  where user_id = v_user
    and id in (
      select id from public.recently_played
      where user_id = v_user
      order by played_at desc
      offset 50
    );
end;
$$;

revoke all on function public.record_play(uuid) from public, anon;
grant execute on function public.record_play(uuid) to authenticated;

-- 5.2 add songs to a playlist (appends; silently skips duplicates). Runs with the
--     caller's rights, so RLS guarantees only the owner can add songs.
create or replace function public.add_songs_to_playlist(p_playlist_id uuid, p_song_ids uuid[])
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_start integer;
  v_added integer;
begin
  select coalesce(max(position), 0) into v_start
  from public.playlist_songs
  where playlist_id = p_playlist_id;

  insert into public.playlist_songs (playlist_id, song_id, position)
  select p_playlist_id, t.song_id, (v_start + t.ord)::integer
  from unnest(p_song_ids) with ordinality as t(song_id, ord)
  on conflict (playlist_id, song_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- 5.3 remove a song and close the gap in the ordering
create or replace function public.remove_song_from_playlist(p_playlist_id uuid, p_song_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.playlist_songs
  where playlist_id = p_playlist_id and song_id = p_song_id;

  with ranked as (
    select id, row_number() over (order by position, added_at) as rn
    from public.playlist_songs
    where playlist_id = p_playlist_id
  )
  update public.playlist_songs ps
  set position = ranked.rn::integer
  from ranked
  where ps.id = ranked.id;
end;
$$;

-- 5.4 re-order: p_song_ids is the full list of song ids in the new order
create or replace function public.reorder_playlist_songs(p_playlist_id uuid, p_song_ids uuid[])
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.playlist_songs ps
  set position = t.ord::integer
  from unnest(p_song_ids) with ordinality as t(song_id, ord)
  where ps.playlist_id = p_playlist_id
    and ps.song_id = t.song_id;
end;
$$;

-- 5.5 display names of other users (e.g. the owner of a public playlist).
--     Exposes ONLY id / username / avatar - never e-mail addresses.
create or replace function public.get_public_profiles(p_ids uuid[])
returns table (id uuid, username text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.id = any (p_ids);
$$;

grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;

-- 5.6 used by the sign-up form to give friendly "username taken" feedback
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(p_username)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 6. STORAGE
--    audio, covers           -> public read, ADMIN write
--    avatars, playlist-covers -> public read, users write inside their own folder
--                                (folder name = their user id)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', true, 52428800,
    array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/webm']),
  ('covers', 'covers', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('playlist-covers', 'playlist-covers', true, 3145728,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "melodify_storage_public_read" on storage.objects;
create policy "melodify_storage_public_read" on storage.objects
  for select
  using (bucket_id in ('audio', 'covers', 'avatars', 'playlist-covers'));

drop policy if exists "melodify_storage_admin_insert" on storage.objects;
create policy "melodify_storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('audio', 'covers') and public.is_admin());

drop policy if exists "melodify_storage_admin_update" on storage.objects;
create policy "melodify_storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('audio', 'covers') and public.is_admin());

drop policy if exists "melodify_storage_admin_delete" on storage.objects;
create policy "melodify_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('audio', 'covers') and public.is_admin());

drop policy if exists "melodify_storage_user_insert" on storage.objects;
create policy "melodify_storage_user_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "melodify_storage_user_update" on storage.objects;
create policy "melodify_storage_user_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "melodify_storage_user_delete" on storage.objects;
create policy "melodify_storage_user_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'playlist-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Done. Next: run supabase/seed.sql for sample data.
