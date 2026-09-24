# Melodify

Melodify is a full-stack music streaming web app: accounts, a persistent player, playlists, likes, a real queue,
search, recommendations and an admin dashboard for uploading music. It runs entirely on **free tiers**
(Vercel Hobby + Supabase Free) and needs no paid API.

> The name, logo, colours, artwork and layout are original. Every artist, album and song in the sample data is
> fictional, and the demo audio is placeholder audio (see [Sample data](#sample-data)).

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Folder structure](#folder-structure)
4. [Setup in 10 minutes](#setup-in-10-minutes)
   - [1. Create the Supabase project](#1-create-the-supabase-project)
   - [2. Create the tables (run the SQL schema)](#2-create-the-tables-run-the-sql-schema)
   - [3. Storage buckets](#3-storage-buckets)
   - [4. Configure authentication](#4-configure-authentication)
   - [5. Environment variables](#5-environment-variables)
   - [6. Run locally](#6-run-locally)
   - [7. Become the admin](#7-become-the-admin)
5. [Deployment (GitHub, Vercel, custom domain)](#deployment)
6. [How it works](#how-it-works)
7. [Sample data](#sample-data)
8. [Free-tier limits and known limitations](#free-tier-limits-and-known-limitations)
9. [Troubleshooting](#troubleshooting)

---

## Features

| Area | What you get |
| --- | --- |
| **Landing page** | Logo, hero, "Listen to your music anywhere", Get Started / Log in, feature list, live "Recently added" preview (statically cached, refreshed every 5 minutes) |
| **Auth** | Sign up, log in, log out, forgot password, password reset, e-mail confirmation, profile (username, avatar, e-mail, created_at), protected routes (middleware + server checks) |
| **Dashboard** | Home (recently played, recommended, popular, recently added, albums, artists, playlists), Search, Your Library, Liked Songs, Playlists, Settings. Sidebar on desktop, bottom bar on phones |
| **Player** | One global `Audio` element that survives navigation. Play, pause, previous, next, seek, time, volume, mute, shuffle, repeat (off / all / one), queue, artwork, like. Lock-screen controls through the Media Session API. Full-screen "now playing" sheet on phones |
| **Search** | Type-ahead search over songs (title, genre, artist, album), artists, albums and playlists. Query lives in the URL, so results can be shared |
| **Detail pages** | Song, artist (bio, popular songs, albums, singles, follow), album (track list, total duration, save), playlist |
| **Playlists** | Create, rename, delete, cover image, public / private, add / remove songs, drag-and-drop reorder (or Move up / down), play, like other people's playlists |
| **Likes & library** | Liked songs (play all, add all to a playlist), followed artists, saved albums, saved playlists, filters (Playlists, Songs, Albums, Artists, Recently played) |
| **Queue** | Add to queue, play next, remove, drag / arrow reorder, clear, jump to any track. Shuffle re-orders the real queue and un-shuffling restores the original order |
| **Recently played** | One row per song per user, `played_at` refreshed on replays, trimmed to the 50 most recent, shows "played 5 min ago" |
| **Recommendations** | Database-driven: taste profile from plays (weighted by replays), likes and follows, then genre/artist affinity + popularity ranking, "similar artists", popular-songs fallback |
| **Admin** | Upload songs (length auto-detected), artwork, create / edit / delete artists, albums, songs, manage users (roles, delete) and playlists (visibility, delete) |
| **Security** | Row Level Security on every table and storage bucket. Service-role key is server-only and optional |

## Tech stack

- **Next.js 15** (App Router, React Server Components, Server Actions) + **TypeScript**
- **React 19**, **Tailwind CSS 3**, shadcn/ui-style components (Radix UI Dialog / Dropdown, `class-variance-authority`)
- **Supabase**: Auth, PostgreSQL, Storage (`@supabase/ssr`, `@supabase/supabase-js`)
- **HTML5 Audio API** for playback, **Lucide** icons, **Sonner** toasts
- Deploys to **Vercel**

## Folder structure

```
app/
  (auth)/            login, signup, forgot-password, reset-password
  (app)/             signed-in area: home, search, library, liked, playlists, playlist/[id],
                     song/[id], album/[id], artist/[id], settings, admin/*
  auth/callback/     e-mail link handler (exchanges ?code= for a session)
  actions/           Server Actions (admin: delete user, uses the service-role key on the server)
  page.tsx           landing page
components/
  ui/                buttons, inputs, dialogs, dropdown, skeleton, empty / error states ...
  layout/            app shell, sidebar, mobile nav, player dock, queue panel, now-playing sheet
  music/             cards, shelves, track rows, menus, playlist dialogs, like / play buttons
  auth/  admin/  landing/  settings/  brand/
contexts/
  audio-context.tsx  global audio provider + queue reducer (single Audio instance)
  library-context.tsx  optimistic likes / follows / saved albums / playlists
  ui-context.tsx     queue panel, now-playing sheet, dialogs
hooks/               use-debounce, use-drag-sort, use-signed-in
lib/
  supabase/          browser, server, middleware and public clients
  data/              server-side queries (songs, albums, artists, playlists, library, search,
                     recommendations, admin)
  mutations.ts       client-side writes (likes, playlists, play history) - protected by RLS
  storage.ts         uploads to Supabase Storage
  utils.ts nav.ts share.ts auth-errors.ts client-data.ts
types/               shared TypeScript types
supabase/
  schema.sql         tables, indexes, RLS policies, triggers, RPC functions, storage buckets
  seed.sql           5 artists, 5 albums, 20 songs, 5 playlists
public/covers/       original SVG artwork used by the sample data
middleware.ts        session refresh + route protection
```

---

## Setup in 10 minutes

You need: **Node.js 18.18+** (Node 20 or 22 recommended), a free [Supabase](https://supabase.com) account and a free
[Vercel](https://vercel.com) account (only for deploying).

### 1. Create the Supabase project

1. Sign in at <https://supabase.com/dashboard> and click **New project**.
2. Pick an organisation, give the project a name (e.g. `melodify`), choose a strong **database password** (save it),
   pick the region closest to your users and choose the **Free** plan.
3. Wait about two minutes until the project is ready.
4. Open **Project Settings -> API** (newer dashboards call it **API Keys**) and copy:
   - the **Project URL** (`https://xxxxxxxx.supabase.co`)
   - the public key: the **anon** key (legacy tab) **or** the **publishable** key. Either works.
   - (optional) the **service_role** / **secret** key, only needed for the admin "Delete user" button. Keep it private.

### 2. Create the tables (run the SQL schema)

1. In the dashboard open **SQL Editor -> New query**.
2. Open `supabase/schema.sql` from this repo, copy **everything**, paste it into the editor and press **Run**.
   You should see "Success. No rows returned". The script is idempotent, so running it twice is harmless.
   It creates:
   - tables `profiles`, `artists`, `albums`, `songs`, `playlists`, `playlist_songs`, `liked_songs`,
     `followed_artists`, `saved_albums`, `liked_playlists`, `recently_played`
     (primary keys, foreign keys, unique constraints, timestamps, indexes)
   - triggers that create a profile on sign-up and protect the `role` column
   - Row Level Security policies for every table
   - helper functions used by the app (`record_play`, `add_songs_to_playlist`, `reorder_playlist_songs`, ...)
   - the four storage buckets and their policies
3. Open a **new query**, paste `supabase/seed.sql` and **Run** it to add sample music.
   (The 5 sample playlists need a user to own them. If you haven't signed up yet, run `seed.sql` again after step 7.)

### 3. Storage buckets

`schema.sql` already creates these **public** buckets, so normally there is nothing to do. Check
**Storage** in the dashboard:

| Bucket | Purpose | Who can upload |
| --- | --- | --- |
| `audio` | song files (max 50 MB each) | admins |
| `covers` | album, artist and song artwork | admins |
| `avatars` | profile pictures | each user, inside their own folder |
| `playlist-covers` | custom playlist covers | each user, inside their own folder |

If a bucket is missing (some organisations restrict SQL access to the `storage` schema), create it manually:
**Storage -> New bucket**, use the exact name from the table, switch **Public bucket** on, then re-run
`schema.sql` so the policies attach.

### 4. Configure authentication

1. **Authentication -> Sign In / Providers -> Email** must be enabled (it is by default).
2. **Confirm email**: leave it ON for production. While experimenting you can switch it off so sign-ups log in immediately.
3. **Authentication -> URL Configuration**
   - **Site URL**: `http://localhost:3000` for now (you will change it to your real URL after deploying).
   - **Redirect URLs**: add `http://localhost:3000/**`
     (after deploying also add `https://YOUR-APP.vercel.app/**` and your custom domain, see [Deployment](#deployment)).
4. Optional but recommended before launch: **Authentication -> SMTP Settings** and connect a free e-mail provider.
   Supabase's built-in sender is only meant for testing and is limited to a few e-mails per hour.

> Sign-up, password-reset and confirmation links use the PKCE flow. Open them **in the same browser** you used
> to request them.

### 5. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Where it is used |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser + server (anon or publishable key; safe because of RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | no | **server only**, powers "Delete user" in the admin area. Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION` | no | set `true` to skip Vercel image optimisation if you reach its free quota |

Nothing secret is hard-coded, and `.env*` files are git-ignored.

### 6. Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint over app, components, contexts, hooks, lib, types
npm run typecheck    # tsc --noEmit
```

Without `.env.local` the app still builds and shows a friendly "Connect Supabase" screen instead of crashing.

### 7. Become the admin

1. Open the app, click **Get started** and create your account (confirm the e-mail if confirmation is on).
2. In the Supabase **SQL Editor** run (with your e-mail):

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

3. Reload Melodify. An **Admin** entry appears in the sidebar and the avatar menu.
   Only admins can upload music; ordinary users cannot change their own role (a database trigger blocks it).
4. Add music: **Admin -> Artists** (create one) -> **Albums** (optional) -> **Songs -> Upload song**.
   The track length is read from the audio file automatically.

---

## Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Melodify"
git branch -M main
# create an empty repository on github.com first, then:
git remote add origin https://github.com/YOUR-USER/melodify.git
git push -u origin main
```

`.env.local` is ignored by git, so your keys stay on your machine.

### 2. Deploy to Vercel (free Hobby plan)

1. Go to <https://vercel.com/new> and **Import** your GitHub repository.
2. Framework preset: **Next.js** (auto-detected). Leave build and output settings as they are.
3. Open **Environment Variables** and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (and `SUPABASE_SERVICE_ROLE_KEY` if you want to delete users from the admin area).
4. Click **Deploy**. When it finishes you get a URL such as `https://melodify-xyz.vercel.app`.
5. Back in Supabase, **Authentication -> URL Configuration**:
   - set **Site URL** to your Vercel URL
   - add `https://melodify-xyz.vercel.app/**` to **Redirect URLs**
   - to allow preview deployments too, add `https://*-YOUR-TEAM.vercel.app/**`

Every `git push` to `main` redeploys automatically.

### 3. Connect a custom domain (optional)

1. Vercel project -> **Settings -> Domains -> Add** and enter your domain (e.g. `music.example.com`).
2. Add the DNS record Vercel shows at your domain registrar. Typically an `A` record to `76.76.21.21` for a root
   domain, or a `CNAME` to `cname.vercel-dns.com` for a subdomain. Use the exact values Vercel displays.
3. Wait for DNS to propagate (minutes to a few hours). Vercel issues the HTTPS certificate automatically.
4. Update Supabase **Site URL** and **Redirect URLs** with `https://music.example.com` and `https://music.example.com/**`.

---

## How it works

- **Persistent audio.** `AudioProvider` sits in the root layout and owns a single module-level `Audio` object, so
  music never restarts when you navigate. Playback is started synchronously inside click handlers (good for mobile
  browsers). Failed tracks show a toast and playback skips ahead (giving up after three failures in a row).
- **Queue.** A reducer models the queue as one ordered list plus a current index. *Play next* inserts after the
  current song, *Add to queue* appends, drag-and-drop or arrows reorder, *Clear* drops what is "up next".
  Shuffle keeps played songs and the current one in place, shuffles the rest and remembers the original order.
- **Recently played.** After a song has really played for a while (10 s or half of a short track) the browser
  calls the `record_play` database function: one row per user and song, `played_at` and `play_count` updated,
  history trimmed to 50, global `songs.play_count` incremented (this feeds "Popular tracks").
- **Recommendations.** `lib/data/recommendations.ts` builds a taste profile from recent plays, likes and follows,
  ranks candidate songs from the top genres / artists by affinity plus popularity, hides what you already know, and
  falls back to popular songs for new listeners. No external AI service.
- **Security.** All data access uses the anon key plus the signed-in user's JWT; Row Level Security decides what is
  visible or writable. Catalogue tables are public-read / admin-write, personal tables are owner-only, playlists
  follow their `is_public` flag, storage uploads are admin-only (audio, covers) or folder-per-user (avatars,
  playlist covers). E-mail addresses are never exposed: playlist owners are shown through a function that returns
  only `id`, `username` and `avatar_url`.
- **Performance.** Server Components for data pages, a statically cached landing page (ISR, 5 minutes), horizontal
  shelves loading only a dozen items, paginated admin lists, "Load more" for liked songs, `next/image` with lazy
  loading, indexes on every foreign key and sort column (plus trigram indexes for search when the extension is available).

## Sample data

`supabase/seed.sql` inserts 5 artists, 5 albums (one EP, one single), 20 songs and 5 playlists.

- Names, biographies and songs are **fictional**.
- **The audio is placeholder audio**: the royalty-free demo tracks from
  [SoundHelix](https://www.soundhelix.com/examples/) (17 files, three re-used). The listed durations are approximate.
  Replace them with your own licensed music from the admin dashboard.
- Artwork is the original SVG art in `public/covers/`.

## Free-tier limits and known limitations

| Topic | Limit / behaviour |
| --- | --- |
| Supabase Free storage | 1 GB of files, **50 MB per file**, 5 GB monthly egress. Streaming audio counts as egress: roughly 1,000 full plays of an average 5 MB song per month |
| Supabase Free database | 500 MB. The project **pauses after about a week without activity**; unpause it from the dashboard |
| Supabase e-mail | Built-in sender is rate-limited; add custom SMTP for real users |
| Vercel Hobby | Personal, non-commercial use. Image optimisation has a monthly quota: set `NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION=true` if you reach it |
| Volume on iPhone | iOS ignores `audio.volume`, so use the hardware buttons there (mute still works) |
| Search | Case-insensitive substring search (`ILIKE`), not fuzzy or full-text |
| Play counts | Counted from the browser, so they are indicative rather than tamper-proof |
| Library size | Heart / follow state is loaded for up to 5,000 items per type |
| Playlists | A song can appear once per playlist |
| Uploads | Sent straight from the browser to Supabase Storage (no progress bar; the spinner shows the current step) |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Connect Supabase to start listening" screen | `.env.local` is missing or the dev server was not restarted after editing it. Both `NEXT_PUBLIC_*` variables must be set |
| `Invalid API key` / 401 errors | You pasted the wrong key or a key from another project. Use the **anon / publishable** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `relation "public.songs" does not exist` | `schema.sql` has not been run (or failed part-way). Run the whole file again |
| Sign-up works but no profile / "permission denied" | The `on_auth_user_created` trigger is missing: re-run `schema.sql`. The app also self-heals a missing profile on first load |
| Confirmation / reset link goes to `localhost` or says "invalid or expired" | Fix **Site URL** and **Redirect URLs** in Supabase (Authentication -> URL Configuration) and open the link in the same browser you requested it from |
| No e-mail arrives | Check spam; the built-in sender is heavily rate-limited. Turn off **Confirm email** for testing or configure SMTP |
| Admin link does not appear | Run the `update public.profiles set role = 'admin' ...` statement with your exact e-mail, then reload |
| Upload fails: "The object exceeded the maximum allowed size" | Free plan limit is 50 MB per file. Compress the audio |
| Upload fails: "new row violates row-level security policy" | You are not an admin, or the storage policies are missing (re-run `schema.sql`) |
| Song shows "Couldn't load ..." toast | The audio URL is unreachable. Sample songs need internet access to soundhelix.com; uploaded songs need a **public** `audio` bucket |
| Covers are blank | Storage buckets must be **public**. If you use a custom Supabase domain, `next.config.mjs` derives the allowed image host from `NEXT_PUBLIC_SUPABASE_URL` automatically, rebuild after changing it |
| Music stops on iPhone when the screen locks | Keep the tab active or install the site to the home screen; iOS may suspend background web audio |
| `npm run build` fails with a type or lint error | Run `npm run typecheck` and `npm run lint` to see the exact line, fix it and rebuild. Lint findings are warnings unless they say `error` |
| `npm install` peer-dependency errors | `.npmrc` already sets `legacy-peer-deps=true`; make sure it was committed |

---

Built with Next.js, Supabase and a lot of sound waves.
