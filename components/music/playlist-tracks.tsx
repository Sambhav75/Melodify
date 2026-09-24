'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ListPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { useDragSort } from '@/hooks/use-drag-sort'
import { removeSongFromPlaylist, reorderPlaylist } from '@/lib/mutations'
import type { PlaylistTrack } from '@/types'
import type { MenuExtra } from './song-menu'
import { TrackList } from './track-list'
import { TrackRow } from './track-row'

/**
 * Tracks of a playlist. Owners can drag rows (or use the menu) to reorder and remove songs.
 * Changes show instantly and are saved through the reorder / remove RPC functions.
 */
export function PlaylistTracks({
  playlistId,
  tracks,
  isOwner,
}: {
  playlistId: string
  tracks: PlaylistTrack[]
  isOwner: boolean
}) {
  const router = useRouter()
  const [items, setItems] = React.useState(tracks)

  React.useEffect(() => {
    setItems(tracks)
  }, [tracks])

  const songs = React.useMemo(() => items.map((t) => t.song), [items])
  const source = `playlist:${playlistId}`

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const previous = items
    const next = items.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
    void reorderPlaylist(
      playlistId,
      next.map((t) => t.song.id),
    ).then((result) => {
      if (!result.ok) {
        setItems(previous)
        toast.error(`Couldn't save the new order: ${result.error}`)
      }
    })
  }

  const remove = async (track: PlaylistTrack) => {
    const previous = items
    setItems(items.filter((t) => t.id !== track.id))
    const result = await removeSongFromPlaylist(playlistId, track.song.id)
    if (!result.ok) {
      setItems(previous)
      toast.error(result.error)
      return
    }
    toast.success('Removed from playlist')
    router.refresh()
  }

  const { getRowProps, overIndex } = useDragSort(move)

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListPlus}
        title="This playlist is empty"
        description={
          isOwner
            ? 'Use the "..." menu on any song and choose "Add to playlist" to fill it up.'
            : 'Nothing has been added to this playlist yet.'
        }
      />
    )
  }

  if (!isOwner) return <TrackList songs={songs} source={source} />

  return (
    <div>
      {items.map((track, index) => {
        const extra: MenuExtra[] = [
          { label: 'Move up', icon: ArrowUp, onSelect: () => move(index, index - 1), disabled: index === 0 },
          { label: 'Move down', icon: ArrowDown, onSelect: () => move(index, index + 1), disabled: index === items.length - 1 },
          { label: 'Remove from this playlist', icon: Trash2, destructive: true, onSelect: () => void remove(track) },
        ]
        return (
          <TrackRow
            key={track.id}
            song={track.song}
            index={index}
            songs={songs}
            source={source}
            extra={extra}
            dragProps={getRowProps(index)}
            isDropTarget={overIndex === index}
          />
        )
      })}
    </div>
  )
}
