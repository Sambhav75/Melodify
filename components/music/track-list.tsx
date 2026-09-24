'use client'

import { Clock } from 'lucide-react'
import type { Song } from '@/types'
import { TrackRow } from './track-row'

/** A list of songs. Playing any row queues the whole list starting at that row. */
export function TrackList({
  songs,
  source = null,
  showAlbum = true,
  showCover = true,
  showHeader = true,
  notes,
}: {
  songs: Song[]
  source?: string | null
  showAlbum?: boolean
  showCover?: boolean
  showHeader?: boolean
  /** Optional small text after the artist name, keyed by song id. */
  notes?: Record<string, string>
}) {
  return (
    <div>
      {showHeader && (
        <div className="mb-1 hidden items-center gap-3 border-b border-border px-3 pb-2 text-xs text-muted-foreground md:flex">
          <span className="w-8 shrink-0 text-center">#</span>
          {showCover && <span className="w-11 shrink-0" />}
          <span className="flex-1">Title</span>
          {showAlbum && <span className="hidden w-1/4 lg:block">Album</span>}
          <span className="flex w-[8.5rem] shrink-0 items-center gap-1">
            <span className="w-10" />
            <span className="flex w-12 justify-end">
              <Clock className="h-4 w-4" aria-label="Duration" />
            </span>
            <span className="w-10" />
          </span>
        </div>
      )}
      <div>
        {songs.map((song, index) => (
          <TrackRow
            key={`${song.id}-${index}`}
            song={song}
            index={index}
            songs={songs}
            source={source}
            showAlbum={showAlbum}
            showCover={showCover}
            note={notes?.[song.id]}
          />
        ))}
      </div>
    </div>
  )
}
