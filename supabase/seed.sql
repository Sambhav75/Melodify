-- =====================================================================
--  MELODIFY - sample data
--
--  Run AFTER schema.sql, in the Supabase SQL Editor. Safe to run again.
--
--  * Every artist, album and song below is FICTIONAL.
--  * AUDIO IS PLACEHOLDER: the 17 royalty-free demo tracks published by
--    SoundHelix (https://www.soundhelix.com/examples/). Tracks 18-20 reuse
--    three of them. Replace them with your own licensed music from the
--    admin dashboard (Admin -> Songs -> Upload song).
--  * Durations are approximate for the placeholder audio; the player always
--    shows the real length once a track has loaded.
--  * Cover art points at the generated SVG files in /public/covers.
--  * The 5 sample playlists need an owner. They are attached to the first
--    admin (or, failing that, the first user). If you run this file before
--    signing up, just run it again afterwards.
-- =====================================================================

-- ---------- artists ----------
insert into public.artists (id, name, image_url, biography) values
  ('10000000-0000-0000-0000-000000000001', 'Neon Harbor', '/covers/artist-1.svg',
   'Synthwave duo from an imaginary port city, building glossy night-drive anthems out of analog synths and gated drums. Their debut record imagines a coastline that never goes dark.'),
  ('10000000-0000-0000-0000-000000000002', 'Luna Vesper', '/covers/artist-2.svg',
   'Dream-pop songwriter layering hushed vocals over shimmering guitars and tape haze. Her songs sound like the moment right before you fall asleep.'),
  ('10000000-0000-0000-0000-000000000003', 'Kairo Sound', '/covers/artist-3.svg',
   'Lo-fi producer crafting dusty, unhurried beats for rainy afternoons, late study sessions and slow coffee. Recorded mostly on a battered cassette deck.'),
  ('10000000-0000-0000-0000-000000000004', 'The Marble Owls', '/covers/artist-4.svg',
   'Four-piece indie rock band with a weakness for open roads, rough harmonies and big campfire choruses.'),
  ('10000000-0000-0000-0000-000000000005', 'Aria Blaze', '/covers/artist-5.svg',
   'Electro-pop singer and producer who writes glitter-bright dance floor songs about dancing straight through life''s plot twists.')
on conflict (id) do nothing;

-- ---------- albums ----------
insert into public.albums (id, title, artist_id, cover_url, release_date, album_type) values
  ('20000000-0000-0000-0000-000000000001', 'Midnight Coastline',  '10000000-0000-0000-0000-000000000001', '/covers/album-1.svg', '2023-10-13', 'album'),
  ('20000000-0000-0000-0000-000000000002', 'Paper Moons',         '10000000-0000-0000-0000-000000000002', '/covers/album-2.svg', '2024-03-22', 'album'),
  ('20000000-0000-0000-0000-000000000003', 'Rainy Sunday Tapes',  '10000000-0000-0000-0000-000000000003', '/covers/album-3.svg', '2024-08-09', 'album'),
  ('20000000-0000-0000-0000-000000000004', 'Gravel & Gold',       '10000000-0000-0000-0000-000000000004', '/covers/album-4.svg', '2024-11-01', 'ep'),
  ('20000000-0000-0000-0000-000000000005', 'Electric Confetti',   '10000000-0000-0000-0000-000000000005', '/covers/album-5.svg', '2025-05-16', 'single')
on conflict (id) do nothing;

-- ---------- songs (PLACEHOLDER AUDIO: SoundHelix demo tracks) ----------
insert into public.songs
  (id, title, artist_id, album_id, audio_url, cover_url, duration, genre, release_date, track_number)
values
  ('30000000-0000-0000-0000-000000000001', 'Midnight Coastline', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  '/covers/album-1.svg', 372, 'Synthwave',   '2023-10-13', 1),
  ('30000000-0000-0000-0000-000000000002', 'Chrome Sunset',      '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  '/covers/album-1.svg', 345, 'Synthwave',   '2023-10-13', 2),
  ('30000000-0000-0000-0000-000000000003', 'Tidal Neon',         '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  '/covers/album-1.svg', 322, 'Synthwave',   '2023-10-13', 3),
  ('30000000-0000-0000-0000-000000000004', 'Arcade Skyline',     '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  '/covers/album-1.svg', 300, 'Synthwave',   '2023-10-13', 4),
  ('30000000-0000-0000-0000-000000000005', 'Last Train to Vega', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  '/covers/album-1.svg', 353, 'Synthwave',   '2023-10-13', 5),
  ('30000000-0000-0000-0000-000000000006', 'Paper Moons',        '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',  '/covers/album-2.svg', 384, 'Dream Pop',   '2024-03-22', 1),
  ('30000000-0000-0000-0000-000000000007', 'Velvet Static',      '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',  '/covers/album-2.svg', 425, 'Dream Pop',   '2024-03-22', 2),
  ('30000000-0000-0000-0000-000000000008', 'Slow Bloom',         '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',  '/covers/album-2.svg', 356, 'Dream Pop',   '2024-03-22', 3),
  ('30000000-0000-0000-0000-000000000009', 'Glass Garden',       '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',  '/covers/album-2.svg', 330, 'Dream Pop',   '2024-03-22', 4),
  ('30000000-0000-0000-0000-000000000010', 'Cloudline',          '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', '/covers/album-2.svg', 400, 'Dream Pop',   '2024-03-22', 5),
  ('30000000-0000-0000-0000-000000000011', 'Rainy Sunday',       '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', '/covers/album-3.svg', 305, 'Lo-fi',       '2024-08-09', 1),
  ('30000000-0000-0000-0000-000000000012', 'Coffee & Vinyl',     '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', '/covers/album-3.svg', 370, 'Lo-fi',       '2024-08-09', 2),
  ('30000000-0000-0000-0000-000000000013', 'Window Seat',        '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', '/covers/album-3.svg', 335, 'Lo-fi',       '2024-08-09', 3),
  ('30000000-0000-0000-0000-000000000014', 'Cassette Dreams',    '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', '/covers/album-3.svg', 348, 'Lo-fi',       '2024-08-09', 4),
  ('30000000-0000-0000-0000-000000000015', 'Gravel Road',        '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', '/covers/album-4.svg', 360, 'Indie Rock',  '2024-11-01', 1),
  ('30000000-0000-0000-0000-000000000016', 'Golden Hollow',      '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', '/covers/album-4.svg', 315, 'Indie Rock',  '2024-11-01', 2),
  ('30000000-0000-0000-0000-000000000017', 'Ferryman''s Song',   '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', '/covers/album-4.svg', 342, 'Indie Rock',  '2024-11-01', 3),
  ('30000000-0000-0000-0000-000000000018', 'Ash & Ember',        '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  '/covers/album-4.svg', 372, 'Indie Rock',  '2024-11-01', 4),
  ('30000000-0000-0000-0000-000000000019', 'Electric Confetti',  '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  '/covers/album-5.svg', 345, 'Electro Pop', '2025-05-16', 1),
  ('30000000-0000-0000-0000-000000000020', 'Afterparty Lights',  '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  '/covers/album-5.svg', 322, 'Electro Pop', '2025-05-16', 2)
on conflict (id) do nothing;

-- ---------- playlists (need an owner, see note at the top) ----------
do $$
declare
  v_owner uuid;
begin
  select id into v_owner
  from public.profiles
  order by (role = 'admin') desc, created_at asc
  limit 1;

  if v_owner is null then
    raise notice 'No users yet - sample playlists skipped. Sign up in the app, then run seed.sql again.';
    return;
  end if;

  insert into public.playlists (id, user_id, name, description, is_public) values
    ('40000000-0000-0000-0000-000000000001', v_owner, 'Late Night Drive',   'Neon lights, empty roads and a full tank.',            true),
    ('40000000-0000-0000-0000-000000000002', v_owner, 'Focus Flow',         'Soft beats for deep work and long study sessions.',     true),
    ('40000000-0000-0000-0000-000000000003', v_owner, 'Sunday Slow Down',   'Hazy, warm and unhurried.',                            true),
    ('40000000-0000-0000-0000-000000000004', v_owner, 'Golden Hour Mix',    'Guitars, glitter and the last hour of daylight.',       true),
    ('40000000-0000-0000-0000-000000000005', v_owner, 'Neon Nights',        'Synths up, lights down.',                              true)
  on conflict (id) do nothing;

  insert into public.playlist_songs (playlist_id, song_id, position) values
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 2),
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 3),
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 4),
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010', 5),
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000019', 6),

    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 1),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', 2),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000013', 3),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000014', 4),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000009', 5),

    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', 1),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000008', 2),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000011', 3),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000013', 4),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000017', 5),

    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000015', 1),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000016', 2),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000018', 3),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000019', 4),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000020', 5),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 6),

    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 1),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 2),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 3),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 4),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000019', 5),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000020', 6)
  on conflict (playlist_id, song_id) do nothing;
end
$$;
