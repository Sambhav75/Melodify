'use client'

import * as React from 'react'
import { ListPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/contexts/library-context'
import { useUI } from '@/contexts/ui-context'
import { fetchLikedSongs } from '@/lib/client-data'
import { CollectionPlayButton } from './play-button'

/** "Play all" and "Add all to playlist" for Liked Songs (loads up to 500 songs on demand). */
export function LikedActions() {
  const { openAddToPlaylist } = useUI()
  const { likedCount } = useLibrary()
  const [busy, setBusy] = React.useState(false)

  const addAll = async () => {
    setBusy(true)
    try {
      const songs = await fetchLikedSongs()
      if (songs.length === 0) toast.info('Like a few songs first.')
      else openAddToPlaylist(songs)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load your liked songs')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <CollectionPlayButton source="liked" load={() => fetchLikedSongs()} label="Play liked songs" />
      <Button variant="secondary" onClick={() => void addAll()} disabled={busy || likedCount === 0}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
        Add all to playlist
      </Button>
    </>
  )
}
