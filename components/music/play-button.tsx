'use client'

import * as React from 'react'
import { Loader2, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { usePlayer } from '@/contexts/audio-context'
import { cn } from '@/lib/utils'
import type { Song } from '@/types'

const SIZES = {
  sm: 'h-10 w-10 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-12 w-12 [&_svg]:h-5 [&_svg]:w-5',
  lg: 'h-14 w-14 [&_svg]:h-6 [&_svg]:w-6',
} as const

export type PlaySize = keyof typeof SIZES

/** The round gradient play/pause button. While playing, it sends out slow "ripples". */
export function PlayCircle({
  playing,
  loading = false,
  onClick,
  size = 'md',
  label,
  revealOnHover = false,
  className,
}: {
  playing: boolean
  loading?: boolean
  onClick: () => void
  size?: PlaySize
  label: string
  /** Card overlays: hidden until the card is hovered/focused on desktop, always visible on touch screens. */
  revealOnHover?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-xl shadow-black/40 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
        SIZES[size],
        revealOnHover &&
          !playing &&
          'transition-all duration-200 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100',
        className,
      )}
    >
      {playing && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-ripple rounded-full bg-primary/50" />
      )}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : playing ? (
        <Pause className="fill-current" />
      ) : (
        <Play className="translate-x-px fill-current" />
      )}
    </button>
  )
}

/** Play/pause for one song, queueing the surrounding list (e.g. the shelf it sits in). */
export function SongPlayButton({
  songs,
  index = 0,
  source = null,
  size = 'md',
  revealOnHover = false,
  className,
}: {
  songs: Song[]
  index?: number
  source?: string | null
  size?: PlaySize
  revealOnHover?: boolean
  className?: string
}) {
  const { current, isPlaying, playSongs, togglePlay } = usePlayer()
  const song = songs[index]
  const active = Boolean(song) && current?.id === song?.id

  return (
    <PlayCircle
      size={size}
      className={className}
      revealOnHover={revealOnHover}
      playing={active && isPlaying}
      label={active && isPlaying ? `Pause ${song?.title ?? ''}` : `Play ${song?.title ?? ''}`}
      onClick={() => (active ? togglePlay() : playSongs(songs, index, source))}
    />
  )
}

/**
 * Play/pause for a whole album, playlist, artist or liked-songs list.
 * Pass `songs` when they are already loaded, or `load` to fetch them on demand.
 */
export function CollectionPlayButton({
  source,
  songs,
  load,
  size = 'lg',
  label = 'Play',
  revealOnHover = false,
  className,
}: {
  source: string
  songs?: Song[]
  load?: () => Promise<Song[]>
  size?: PlaySize
  label?: string
  revealOnHover?: boolean
  className?: string
}) {
  const { source: activeSource, isPlaying, playSongs, togglePlay } = usePlayer()
  const [loading, setLoading] = React.useState(false)
  const active = activeSource === source

  const handleClick = async () => {
    if (active) {
      togglePlay()
      return
    }
    // Already-loaded songs start playing synchronously inside the click (best for mobile browsers).
    if (songs && songs.length > 0) {
      playSongs(songs, 0, source)
      return
    }
    if (!load) {
      toast.info('There is nothing to play here yet.')
      return
    }
    try {
      setLoading(true)
      const list = await load()
      if (list.length === 0) {
        toast.info('There is nothing to play here yet.')
        return
      }
      playSongs(list, 0, source)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load the tracks.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PlayCircle
      size={size}
      className={className}
      revealOnHover={revealOnHover}
      loading={loading}
      playing={active && isPlaying}
      label={active && isPlaying ? `Pause ${label}` : label}
      onClick={() => void handleClick()}
    />
  )
}
