'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import type { Album, ArtistMini, Playlist, Song } from '@/types'
import { AlbumCard, ArtistCard, PlaylistCard, SongCard } from './cards'

/** A titled, horizontally scrolling row of cards (swipe on touch, arrows on desktop). */
export function Shelf({
  title,
  subtitle,
  href,
  children,
}: {
  title: string
  subtitle?: string | null
  href?: string
  children: React.ReactNode
}) {
  const scroller = React.useRef<HTMLDivElement>(null)

  const scrollBy = (direction: -1 | 1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="py-4" aria-label={title}>
      <div className="flex items-end justify-between gap-4 px-4 md:px-8">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold md:text-xl">{title}</h2>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {href && (
            <Link href={href} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Show all
            </Link>
          )}
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-1)}
            className="hidden h-9 w-9 place-items-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(1)}
            className="hidden h-9 w-9 place-items-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3 md:px-8"
      >
        {children}
      </div>
    </section>
  )
}

function ShelfItem({ children }: { children: React.ReactNode }) {
  return <div className="w-[9.5rem] shrink-0 snap-start sm:w-44 md:w-48">{children}</div>
}

export function SongShelf({
  title,
  subtitle,
  href,
  songs,
  source = null,
  playedAt,
}: {
  title: string
  subtitle?: string | null
  href?: string
  songs: Song[]
  source?: string | null
  /** song id -> ISO timestamp; shows "played 5 min ago" under the title. */
  playedAt?: Record<string, string>
}) {
  return (
    <Shelf title={title} subtitle={subtitle} href={href}>
      {songs.map((song, index) => (
        <ShelfItem key={`${song.id}-${index}`}>
          <SongCard
            song={song}
            songs={songs}
            index={index}
            source={source}
            note={
              playedAt?.[song.id] ? (
                <time dateTime={playedAt[song.id]} suppressHydrationWarning>
                  Played {timeAgo(playedAt[song.id])}
                </time>
              ) : undefined
            }
          />
        </ShelfItem>
      ))}
    </Shelf>
  )
}

export function AlbumShelf({
  title,
  subtitle,
  href,
  albums,
}: {
  title: string
  subtitle?: string | null
  href?: string
  albums: Album[]
}) {
  return (
    <Shelf title={title} subtitle={subtitle} href={href}>
      {albums.map((album) => (
        <ShelfItem key={album.id}>
          <AlbumCard album={album} />
        </ShelfItem>
      ))}
    </Shelf>
  )
}

export function ArtistShelf({
  title,
  subtitle,
  href,
  artists,
}: {
  title: string
  subtitle?: string | null
  href?: string
  artists: ArtistMini[]
}) {
  return (
    <Shelf title={title} subtitle={subtitle} href={href}>
      {artists.map((artist) => (
        <ShelfItem key={artist.id}>
          <ArtistCard artist={artist} />
        </ShelfItem>
      ))}
    </Shelf>
  )
}

export function PlaylistShelf({
  title,
  subtitle,
  href,
  playlists,
}: {
  title: string
  subtitle?: string | null
  href?: string
  playlists: Playlist[]
}) {
  return (
    <Shelf title={title} subtitle={subtitle} href={href}>
      {playlists.map((playlist) => (
        <ShelfItem key={playlist.id}>
          <PlaylistCard playlist={playlist} />
        </ShelfItem>
      ))}
    </Shelf>
  )
}

/** Wrapped grid variant used on library / search pages. */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{children}</div>
  )
}
