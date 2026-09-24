'use client'

import * as React from 'react'
import Link from 'next/link'
import { GripVertical, Pause, Play } from 'lucide-react'
import { usePlayer } from '@/contexts/audio-context'
import { useLibrary } from '@/contexts/library-context'
import { cn, formatDuration, songCover } from '@/lib/utils'
import type { Song } from '@/types'
import { CoverArt } from './cover-art'
import { Equalizer } from './equalizer'
import { LikeButton } from './like-button'
import { SongMenu, type MenuExtra } from './song-menu'

/** On phones a title is plain text (tapping the row plays it); from md up it links to the song page. */
function ResponsiveLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <>
      <Link href={href} prefetch={false} className={cn('hidden hover:underline md:block', className)}>
        {children}
      </Link>
      <span className={cn('block md:hidden', className)}>{children}</span>
    </>
  )
}

export interface RowDragProps {
  draggable: true
  onDragStart: (e: React.DragEvent<HTMLElement>) => void
  onDragOver: (e: React.DragEvent<HTMLElement>) => void
  onDrop: (e: React.DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export function TrackRow({
  song,
  index,
  songs,
  source = null,
  showAlbum = true,
  showCover = true,
  extra,
  dragProps,
  isDropTarget = false,
  note,
}: {
  song: Song
  /** Position of this song inside `songs` (also the number shown on the left). */
  index: number
  /** The list that becomes the queue when this row is played. */
  songs: Song[]
  source?: string | null
  showAlbum?: boolean
  showCover?: boolean
  extra?: MenuExtra[]
  dragProps?: RowDragProps
  isDropTarget?: boolean
  note?: string
}) {
  const { current, isPlaying, playSongs, togglePlay } = usePlayer()
  const { isLiked } = useLibrary()
  const isCurrent = current?.id === song.id
  const liked = isLiked(song.id)

  const play = () => (isCurrent ? togglePlay() : playSongs(songs, index, source))

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, [role="menu"], [role="menuitem"], [role="dialog"]')) return
    play()
  }

  return (
    <div
      {...dragProps}
      onClick={handleRowClick}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.06] md:px-3',
        isCurrent && 'bg-white/[0.05]',
        isDropTarget && 'ring-1 ring-primary',
      )}
    >
      {dragProps && (
        <span className="hidden shrink-0 cursor-grab text-muted-foreground/60 md:block" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </span>
      )}

      {/* number / equalizer / play button */}
      <div className="relative grid h-11 w-8 shrink-0 place-items-center text-sm text-muted-foreground">
        <span className="group-focus-within:hidden group-hover:hidden">
          {isCurrent ? <Equalizer playing={isPlaying} /> : <span className="tabular-nums">{index + 1}</span>}
        </span>
        <button
          type="button"
          aria-label={isCurrent && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          onClick={(e) => {
            e.stopPropagation()
            play()
          }}
          className="absolute inset-0 hidden place-items-center text-foreground group-focus-within:grid group-hover:grid"
        >
          {isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>
      </div>

      {showCover && (
        <CoverArt
          src={songCover(song)}
          alt=""
          seed={song.album_id ?? song.id}
          sizes="44px"
          rounded="rounded-md"
          className="h-11 w-11 shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        <ResponsiveLink
          href={`/song/${song.id}`}
          className={cn('truncate text-[15px] font-medium', isCurrent && 'text-primary')}
        >
          {song.title}
        </ResponsiveLink>
        <div className="flex min-w-0 items-center gap-1 truncate text-sm text-muted-foreground">
          <Link href={`/artist/${song.artist_id}`} prefetch={false} className="truncate hover:text-foreground hover:underline">
            {song.artist?.name ?? 'Unknown artist'}
          </Link>
          {note && <span className="shrink-0">· {note}</span>}
        </div>
      </div>

      {showAlbum && (
        <div className="hidden w-1/4 min-w-0 truncate text-sm text-muted-foreground lg:block">
          {song.album ? (
            <Link href={`/album/${song.album.id}`} prefetch={false} className="hover:text-foreground hover:underline">
              {song.album.title}
            </Link>
          ) : (
            <span aria-hidden="true">-</span>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <LikeButton
          songId={song.id}
          className={cn(!liked && 'md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100')}
        />
        <span className="w-12 text-right text-sm tabular-nums text-muted-foreground">{formatDuration(song.duration)}</span>
        <SongMenu song={song} extra={extra} />
      </div>
    </div>
  )
}
