'use client'

import * as React from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useLibrary } from '@/contexts/library-context'
import { fetchLikedSongs } from '@/lib/client-data'
import { pluralize } from '@/lib/utils'
import type { Song } from '@/types'
import { TrackList } from './track-list'

/** Live "N songs" text that follows likes / unlikes instantly. */
export function LikedCount() {
  const { likedCount } = useLibrary()
  return <>{pluralize(likedCount, 'song')}</>
}

/** Paginated list of liked songs ("Load more"). Songs you un-like disappear from the list right away. */
export function LikedSongsList({ initialSongs, pageSize }: { initialSongs: Song[]; pageSize: number }) {
  const { isLiked, likedCount } = useLibrary()
  const [songs, setSongs] = React.useState(initialSongs)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setSongs(initialSongs)
  }, [initialSongs])

  const visible = React.useMemo(() => songs.filter((s) => isLiked(s.id)), [songs, isLiked])
  const hasMore = likedCount > visible.length && songs.length >= pageSize

  const loadMore = async () => {
    setLoading(true)
    try {
      const more = await fetchLikedSongs(songs.length, pageSize)
      setSongs((prev) => {
        const known = new Set(prev.map((s) => s.id))
        return [...prev, ...more.filter((s) => !known.has(s.id))]
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load more songs')
    } finally {
      setLoading(false)
    }
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Songs you like will appear here"
        description="Tap the heart on any song to save it to your Liked Songs."
      />
    )
  }

  return (
    <div>
      <TrackList songs={visible} source="liked" />
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => void loadMore()} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
