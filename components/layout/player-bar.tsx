'use client'

import * as React from 'react'
import Link from 'next/link'
import { ListMusic, Music, Pause, Play, SkipForward } from 'lucide-react'
import { CoverArt } from '@/components/music/cover-art'
import { LikeButton } from '@/components/music/like-button'
import { usePlayer } from '@/contexts/audio-context'
import { useUI } from '@/contexts/ui-context'
import { cn, hueFor, songCover } from '@/lib/utils'
import { MiniProgress, SeekBar } from './seek-bar'
import { TransportControls } from './transport-controls'
import { VolumeControl } from './volume-control'

function NowPlaying() {
  const { current } = usePlayer()

  if (!current) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Music className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Nothing playing</p>
          <p className="truncate text-xs text-muted-foreground">Pick a song to start listening</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link href={`/song/${current.id}`} prefetch={false} className="block h-14 w-14 shrink-0">
        <CoverArt
          src={songCover(current)}
          alt={`Cover of ${current.title}`}
          seed={current.album_id ?? current.id}
          sizes="56px"
          rounded="rounded-xl"
        />
      </Link>
      <div className="min-w-0">
        <Link href={`/song/${current.id}`} prefetch={false} className="block truncate text-sm font-semibold hover:underline">
          {current.title}
        </Link>
        <Link
          href={`/artist/${current.artist_id}`}
          prefetch={false}
          className="block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {current.artist?.name ?? 'Unknown artist'}
        </Link>
      </div>
      <LikeButton songId={current.id} />
    </div>
  )
}

function QueueToggle() {
  const { queueOpen, toggleQueue } = useUI()
  const { upcoming } = usePlayer()

  return (
    <button
      type="button"
      aria-label={queueOpen ? 'Hide queue' : 'Show queue'}
      aria-pressed={queueOpen}
      title="Queue"
      onClick={toggleQueue}
      className={cn(
        'relative grid h-10 w-10 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        queueOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <ListMusic className="h-5 w-5" />
      {upcoming.length > 0 && (
        <span className="absolute -right-0.5 top-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {upcoming.length > 99 ? '99+' : upcoming.length}
        </span>
      )}
    </button>
  )
}

/** Phone mini-player: tap the song to open the full now-playing sheet. */
function MiniPlayer() {
  const { current, isPlaying, togglePlay, next, hasNext } = usePlayer()
  const { setNowPlayingOpen } = useUI()
  if (!current) return null

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border/60">
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={() => setNowPlayingOpen(true)}
          aria-label={`Open player: ${current.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
        >
          <CoverArt
            src={songCover(current)}
            alt=""
            seed={current.album_id ?? current.id}
            sizes="48px"
            rounded="rounded-lg"
            className="h-12 w-12 shrink-0"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{current.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{current.artist?.name ?? 'Unknown artist'}</span>
          </span>
        </button>
        <LikeButton songId={current.id} />
        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className="grid h-12 w-12 place-items-center rounded-full text-foreground"
        >
          {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={!hasNext}
          onClick={next}
          className="grid h-12 w-10 place-items-center rounded-full text-foreground disabled:opacity-30"
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </div>
      <MiniProgress />
    </div>
  )
}

export function PlayerBar() {
  const { current } = usePlayer()
  const hue = hueFor(current?.album_id ?? current?.id ?? 'melodify')

  return (
    <>
      {/* desktop / tablet dock */}
      <div className="hidden shrink-0 px-2 pb-2 pt-2 md:block">
        <div
          className="dock-glow glass grid h-[5.5rem] grid-cols-[minmax(0,1fr)_minmax(18rem,1.6fr)_minmax(0,1fr)] items-center gap-4 rounded-3xl border border-border/60 px-4 shadow-2xl shadow-black/40"
          style={{ '--ambient-hue': hue } as React.CSSProperties}
          role="region"
          aria-label="Music player"
        >
          <NowPlaying />
          <div className="flex flex-col items-center gap-0.5">
            <TransportControls />
            <SeekBar className="max-w-xl" />
          </div>
          <div className="flex items-center justify-end gap-1">
            <QueueToggle />
            <VolumeControl className="hidden lg:flex" />
          </div>
        </div>
      </div>

      {/* phone mini-player, sits above the bottom navigation */}
      {current && (
        <div className="shrink-0 px-2 pb-2 pt-1 md:hidden">
          <MiniPlayer />
        </div>
      )}
    </>
  )
}
