'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUI } from '@/contexts/ui-context'

export function CreatePlaylistButton({
  label = 'New playlist',
  variant = 'default',
}: {
  label?: string
  variant?: 'default' | 'secondary' | 'outline'
}) {
  const { openCreatePlaylist } = useUI()
  return (
    <Button variant={variant} onClick={() => openCreatePlaylist()}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  )
}

/** Dashed "create" tile shown at the end of a playlist grid. */
export function CreatePlaylistTile() {
  const { openCreatePlaylist } = useUI()
  return (
    <button
      type="button"
      onClick={() => openCreatePlaylist()}
      className="group flex w-full flex-col text-left"
      aria-label="Create a new playlist"
    >
      <span className="grid aspect-square w-full place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
        <Plus className="h-10 w-10" />
      </span>
      <span className="mt-3 font-semibold">Create playlist</span>
      <span className="text-sm text-muted-foreground">Start a new collection</span>
    </button>
  )
}
