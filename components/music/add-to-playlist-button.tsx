'use client'

import { ListPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUI } from '@/contexts/ui-context'
import type { Song } from '@/types'

export function AddToPlaylistButton({
  songs,
  label = 'Add to playlist',
  variant = 'secondary',
}: {
  songs: Song[]
  label?: string
  variant?: 'secondary' | 'outline' | 'ghost'
}) {
  const { openAddToPlaylist } = useUI()
  return (
    <Button variant={variant} disabled={songs.length === 0} onClick={() => openAddToPlaylist(songs)}>
      <ListPlus className="h-4 w-4" />
      {label}
    </Button>
  )
}
