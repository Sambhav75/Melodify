'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Lock, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useLibrary } from '@/contexts/library-context'
import { deletePlaylist, updatePlaylist } from '@/lib/mutations'
import type { Playlist, Song } from '@/types'
import { EditPlaylistDialog } from './edit-playlist-dialog'
import { LikePlaylistButton } from './like-button'
import { CollectionPlayButton } from './play-button'
import { ShareButton } from './share-button'

/** Buttons under a playlist header: play, like (others' playlists), or edit / visibility / delete (yours). */
export function PlaylistActions({ playlist, songs, isOwner }: { playlist: Playlist; songs: Song[]; isOwner: boolean }) {
  const router = useRouter()
  const { removePlaylist, patchPlaylist } = useLibrary()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const toggleVisibility = async () => {
    setBusy(true)
    const next = !playlist.is_public
    const result = await updatePlaylist(playlist.id, { is_public: next })
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    patchPlaylist({ id: playlist.id, name: playlist.name, is_public: next, cover_image: playlist.cover_image })
    toast.success(next ? 'Playlist is now public' : 'Playlist is now private')
    router.refresh()
  }

  const handleDelete = async () => {
    setBusy(true)
    const result = await deletePlaylist(playlist.id)
    if (!result.ok) {
      setBusy(false)
      toast.error(result.error)
      return
    }
    removePlaylist(playlist.id)
    toast.success(`Deleted "${playlist.name}"`)
    router.push('/playlists')
    router.refresh()
  }

  return (
    <>
      <CollectionPlayButton source={`playlist:${playlist.id}`} songs={songs} label={`Play ${playlist.name}`} size="lg" />
      {!isOwner && <LikePlaylistButton playlistId={playlist.id} />}
      {isOwner && (
        <>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => void toggleVisibility()} disabled={busy} aria-pressed={playlist.is_public}>
            {playlist.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {playlist.is_public ? 'Public' : 'Private'}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete playlist" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-5 w-5" />
          </Button>
          <EditPlaylistDialog playlist={playlist} open={editOpen} onOpenChange={setEditOpen} />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={`Delete "${playlist.name}"?`}
            description="This removes the playlist for good. The songs themselves stay in Melodify."
            loading={busy}
            onConfirm={handleDelete}
          />
        </>
      )}
      <ShareButton path={`/playlist/${playlist.id}`} title={playlist.name} />
    </>
  )
}
