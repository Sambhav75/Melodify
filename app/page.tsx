import Link from 'next/link'
import { ListMusic, ListPlus, Radio, Sparkles, Upload, Heart } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { HeroArt, WaveStrip } from '@/components/landing/hero-art'
import { HeroActions, LandingNav } from '@/components/landing/landing-nav'
import { CoverArt } from '@/components/music/cover-art'
import { Button } from '@/components/ui/button'
import { getRecentSongs } from '@/lib/data/songs'
import { createPublicClient } from '@/lib/supabase/public'
import { songCover } from '@/lib/utils'
import type { Song } from '@/types'

// Public, cookie-free page: generated once and refreshed every 5 minutes (cheap on free hosting).
export const revalidate = 300

const FEATURES = [
  {
    icon: Radio,
    title: 'Stream from any screen',
    text: 'One player that follows you from page to page. Phone, tablet or desktop, the music never restarts.',
  },
  {
    icon: ListMusic,
    title: 'Playlists that are yours',
    text: 'Create, rename and reorder. Keep them private or share them with everyone on Melodify.',
  },
  {
    icon: Heart,
    title: 'Like, follow, save',
    text: 'A heart on every song, a follow for every artist, a shelf for every album you love.',
  },
  {
    icon: ListPlus,
    title: 'A queue you control',
    text: 'Play next, add to the end, drag things around, shuffle, repeat. It really changes what plays.',
  },
  {
    icon: Sparkles,
    title: 'Recommendations that learn',
    text: 'Suggestions built from what you play, like and follow. No paid AI service behind it.',
  },
  {
    icon: Upload,
    title: 'Bring your own music',
    text: 'Administrators upload tracks and artwork straight into their own Supabase storage.',
  },
]

async function loadRecent(): Promise<Song[]> {
  const client = createPublicClient()
  if (!client) return []
  try {
    return await getRecentSongs(client, 8)
  } catch (error) {
    console.error('[melodify] landing page could not load recent songs', error)
    return []
  }
}

export default async function LandingPage() {
  const recent = await loadRecent()
  const heroCovers = recent.slice(0, 3).map((song) => ({ src: songCover(song), seed: song.album_id ?? song.id }))

  return (
    <div className="ambient min-h-dvh overflow-x-clip">
      <LandingNav />

      <main>
        {/* hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-10 pt-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-12">
          <div className="space-y-7">
            <h1 className="font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[3.35rem]">
              Listen to your music anywhere
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Melodify is a home for the music you love. Build playlists, like songs, follow artists and pick up exactly where
              you stopped, on any device.
            </p>
            <HeroActions />
          </div>
          <HeroArt covers={heroCovers} />
        </section>

        <WaveStrip />

        {/* recently added */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8" aria-labelledby="recent-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="recent-heading" className="font-display text-2xl font-bold md:text-3xl">
                Recently added
              </h2>
              <p className="mt-1 text-muted-foreground">Fresh in the library. Sign up to press play.</p>
            </div>
          </div>

          {recent.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              {recent.map((song) => (
                <li key={song.id}>
                  <Link href={`/login?next=/song/${song.id}`} className="group block">
                    <CoverArt
                      src={songCover(song)}
                      alt=""
                      seed={song.album_id ?? song.id}
                      sizes="(max-width: 640px) 44vw, 260px"
                      className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <p className="mt-3 truncate font-semibold group-hover:underline">{song.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{song.artist?.name ?? 'Unknown artist'}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-3xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              The library is empty for now. Once songs are added in the admin dashboard, they appear here.
            </p>
          )}
        </section>

        {/* features */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 md:px-8" aria-labelledby="features-heading">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 id="features-heading" className="font-display text-2xl font-bold md:text-3xl lg:sticky lg:top-8">
                Everything a music app should do
              </h2>
            </div>
            <ol className="divide-y divide-border border-y border-border">
              {FEATURES.map((feature, index) => (
                <li key={feature.title} className="grid grid-cols-[3rem_1fr] gap-x-4 py-6 sm:grid-cols-[4rem_1fr]">
                  <span className="font-display text-2xl font-semibold text-muted-foreground/60 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-muted-foreground">{feature.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* closing call to action */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/70 px-6 py-14 text-center md:px-12">
            <span aria-hidden="true" className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
            <h2 className="relative font-display text-2xl font-bold md:text-4xl">Your library is waiting</h2>
            <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
              Create a free account in a minute and start listening.
            </p>
            <div className="relative mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:px-8">
          <Logo />
          <p>&copy; {new Date().getFullYear()} Melodify. All artists and tracks in the demo are fictional.</p>
        </div>
      </footer>
    </div>
  )
}
