'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ListMusic, Loader2, Lock, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLibrary } from '@/contexts/library-context'
import { useUI } from '@/contexts/ui-context'
import { addSongsToPlaylist } from '@/lib/mutations'
import type { PlaylistLite } from '@/types'

/** Global "Add to playlist" picker. Open it with useUI().openAddToPlaylist(songs). */
export function AddToPlaylistDialog() {
  const router = useRouter()
  const { addToPlaylistSongs, closeAddToPlaylist, openCreatePlaylist } = useUI()
  const { playlists } = useLibrary()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')

  const songs = addToPlaylistSongs ?? []
  const open = addToPlaylistSongs !== null

  React.useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const filtered = playlists.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))

  const handleAdd = async (playlist: PlaylistLite) => {
    setBusyId(playlist.id)
    const result = await addSongsToPlaylist(
      playlist.id,
      songs.map((s) => s.id),
    )
    setBusyId(null)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    if (result.data === 0) {
      toast.info(songs.length === 1 ? `Already in "${playlist.name}"` : `Those songs are already in "${playlist.name}"`)
    } else {
      toast.success(
        songs.length === 1 ? `Added to "${playlist.name}"` : `Added ${result.data} songs to "${playlist.name}"`,
      )
    }
    router.refresh()
    closeAddToPlaylist()
  }

  const handleCreate = () => {
    const pending = songs
    closeAddToPlaylist()
    openCreatePlaylist(pending)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeAddToPlaylist()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to playlist</DialogTitle>
          <DialogDescription className="truncate">
            {songs.length === 1 ? songs[0].title : `${songs.length} songs`}
          </DialogDescription>
        </DialogHeader>

        <Button variant="secondary" className="justify-start" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New playlist
        </Button>

        {playlists.length > 4 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a playlist"
              className="pl-10"
              aria-label="Find a playlist"
            />
          </div>
        )}

        {playlists.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            You don&apos;t have any playlists yet. Create one to get started.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No playlists match &ldquo;{query}&rdquo;.</p>
        ) : (
          <ul className="scroll-area -mx-2 max-h-72 overflow-y-auto px-2">
            {filtered.map((playlist) => (
              <li key={playlist.id}>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void handleAdd(playlist)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <ListMusic className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{playlist.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {playlist.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {playlist.is_public ? 'Public' : 'Private'}
                    </span>
                  </span>
                  {busyId === playlist.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
