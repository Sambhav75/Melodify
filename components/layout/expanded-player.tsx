'use client'

import * as React from 'react'
import { ChevronDown, ListMusic } from 'lucide-react'
import { CoverArt } from '@/components/music/cover-art'
import { LikeButton } from '@/components/music/like-button'
import { ShareButton } from '@/components/music/share-button'
import { usePlayer } from '@/contexts/audio-context'
import { useUI } from '@/contexts/ui-context'
import { cn, hueFor, songCover } from '@/lib/utils'
import { SeekBar } from './seek-bar'
import { TransportControls } from './transport-controls'
import { VolumeControl } from './volume-control'

/** Full-screen "Now playing" sheet for phones and small tablets. */
export function ExpandedPlayer() {
  const { nowPlayingOpen, setNowPlayingOpen, setQueueOpen } = useUI()
  const { current } = usePlayer()
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const open = nowPlayingOpen && Boolean(current)

  React.useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNowPlayingOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setNowPlayingOpen])

  const hue = hueFor(current?.album_id ?? current?.id ?? 'melodify')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      aria-hidden={!open}
      style={{ '--ambient-hue': hue } as React.CSSProperties}
      className={cn(
        'ambient fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background transition-all duration-300 md:hidden',
        open ? 'translate-y-0' : 'invisible translate-y-full',
      )}
    >
      {current && (
        <div className="safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <button
              ref={closeRef}
              type="button"
              aria-label="Close player"
              onClick={() => setNowPlayingOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-accent"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <p className="text-sm font-medium text-muted-foreground">Now playing</p>
            <button
              type="button"
              aria-label="Open queue"
              onClick={() => {
                setNowPlayingOpen(false)
                setQueueOpen(true)
              }}
              className="grid h-11 w-11 place-items-center rounded-full hover:bg-accent"
            >
              <ListMusic className="h-5 w-5" />
            </button>
          </div>

          <div className="my-6 flex flex-1 items-center">
            <CoverArt
              src={songCover(current)}
              alt={`Cover of ${current.title}`}
              seed={current.album_id ?? current.id}
              sizes="(max-width: 448px) 90vw, 400px"
              priority
              rounded="rounded-3xl"
              className="shadow-2xl shadow-black/60"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold">{current.title}</p>
              <p className="truncate text-muted-foreground">{current.artist?.name ?? 'Unknown artist'}</p>
            </div>
            <LikeButton songId={current.id} size="lg" />
          </div>

          <div className="mt-4">
            <SeekBar />
          </div>
          <TransportControls large className="mt-2" />

          <div className="mt-4 flex items-center justify-between">
            <VolumeControl />
            <ShareButton path={`/song/${current.id}`} title={current.title} className="h-11 w-11" />
          </div>
        </div>
      )}
    </div>
  )
}
