'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, GripVertical, ListMusic, Trash2, X } from 'lucide-react'
import { CoverArt } from '@/components/music/cover-art'
import { Equalizer } from '@/components/music/equalizer'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/contexts/audio-context'
import { useUI } from '@/contexts/ui-context'
import { useDragSort } from '@/hooks/use-drag-sort'
import { cn, formatDuration, songCover } from '@/lib/utils'

/** Slide-over play queue: see what is next, jump to a song, remove, re-order (drag or arrows) or clear. */
export function QueuePanel() {
  const { queueOpen, setQueueOpen } = useUI()
  const { current, isPlaying, upcoming, queueIndex, moveQueueItem, removeFromQueue, clearQueue, jumpTo } = usePlayer()
  const offset = queueIndex + 1

  const { getRowProps, overIndex } = useDragSort((from, to) => moveQueueItem(offset + from, offset + to))

  React.useEffect(() => {
    if (!queueOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQueueOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [queueOpen, setQueueOpen])

  return (
    <aside
      aria-label="Play queue"
      aria-hidden={!queueOpen}
      className={cn(
        'absolute inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-popover/95 shadow-2xl backdrop-blur-xl transition-all duration-300 md:w-[23rem]',
        queueOpen ? 'translate-x-0' : 'invisible translate-x-full',
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
        <h2 className="font-display text-lg font-semibold">Queue</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={clearQueue} disabled={upcoming.length === 0}>
            Clear
          </Button>
          <button
            type="button"
            aria-label="Close queue"
            onClick={() => setQueueOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <h3 className="px-2 pb-2 text-sm font-semibold text-muted-foreground">Now playing</h3>
        {current ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-2 py-2">
            <CoverArt
              src={songCover(current)}
              alt=""
              seed={current.album_id ?? current.id}
              sizes="44px"
              rounded="rounded-md"
              className="h-11 w-11 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{current.title}</p>
              <p className="truncate text-xs text-muted-foreground">{current.artist?.name ?? 'Unknown artist'}</p>
            </div>
            <Equalizer playing={isPlaying} className="mr-2" />
          </div>
        ) : (
          <p className="px-2 py-2 text-sm text-muted-foreground">Nothing is playing.</p>
        )}

        <h3 className="px-2 pb-2 pt-6 text-sm font-semibold text-muted-foreground">
          Next up{upcoming.length > 0 ? ` (${upcoming.length})` : ''}
        </h3>

        {upcoming.length === 0 ? (
          <div className="mx-2 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <ListMusic className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Your queue is empty</p>
            <p className="text-xs text-muted-foreground">
              Use &ldquo;Add to queue&rdquo; or &ldquo;Play next&rdquo; in any song&apos;s menu.
            </p>
          </div>
        ) : (
          <ul>
            {upcoming.map((item, i) => (
              <li
                key={item.uid}
                {...getRowProps(i)}
                className={cn(
                  'group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.06]',
                  overIndex === i && 'ring-1 ring-primary',
                )}
              >
                <span className="hidden shrink-0 cursor-grab text-muted-foreground/60 md:block" aria-hidden="true">
                  <GripVertical className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => jumpTo(offset + i)}
                  aria-label={`Play ${item.song.title} now`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <CoverArt
                    src={songCover(item.song)}
                    alt=""
                    seed={item.song.album_id ?? item.song.id}
                    sizes="44px"
                    rounded="rounded-md"
                    className="h-11 w-11 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.song.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.song.artist?.name ?? 'Unknown artist'} · {formatDuration(item.song.duration)}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => moveQueueItem(offset + i, offset + i - 1)}
                    className="grid h-9 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === upcoming.length - 1}
                    onClick={() => moveQueueItem(offset + i, offset + i + 1)}
                    className="grid h-9 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.song.title} from queue`}
                    onClick={() => removeFromQueue(item.uid)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
