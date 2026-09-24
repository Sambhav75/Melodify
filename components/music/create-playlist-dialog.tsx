'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useLibrary } from '@/contexts/library-context'
import { useUI } from '@/contexts/ui-context'
import { addSongsToPlaylist, createPlaylist } from '@/lib/mutations'

/** Global "Create playlist" dialog. Open it with useUI().openCreatePlaylist(optionalSongs). */
export function CreatePlaylistDialog() {
  const router = useRouter()
  const { createPlaylistState, closeCreatePlaylist } = useUI()
  const { playlists, addPlaylist } = useLibrary()
  const { open, songs } = createPlaylistState

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [isPublic, setIsPublic] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setName(`My playlist #${playlists.length + 1}`)
      setDescription('')
      setIsPublic(false)
      setError(null)
    }
    // only reset when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const result = await createPlaylist({ name, description, is_public: isPublic })
    if (!result.ok) {
      setSaving(false)
      setError(result.error)
      return
    }

    const playlist = result.data
    addPlaylist({ id: playlist.id, name: playlist.name, is_public: playlist.is_public, cover_image: playlist.cover_image })

    if (songs.length > 0) {
      const added = await addSongsToPlaylist(
        playlist.id,
        songs.map((s) => s.id),
      )
      if (!added.ok) toast.error(`Playlist created, but adding songs failed: ${added.error}`)
      else toast.success(`Created "${playlist.name}" with ${added.data} song${added.data === 1 ? '' : 's'}`)
      setSaving(false)
      closeCreatePlaylist()
      router.refresh()
      return
    }

    toast.success(`Created "${playlist.name}"`)
    setSaving(false)
    closeCreatePlaylist()
    router.push(`/playlist/${playlist.id}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && closeCreatePlaylist()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create playlist</DialogTitle>
          <DialogDescription>
            {songs.length > 0
              ? `${songs.length} song${songs.length === 1 ? '' : 's'} will be added to it.`
              : 'Give it a name now, add songs whenever you like.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Name" htmlFor="playlist-name" required error={error}>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoComplete="off"
              autoFocus
              required
            />
          </Field>
          <Field label="Description" htmlFor="playlist-description">
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this playlist for?"
              maxLength={300}
            />
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <label htmlFor="playlist-public" className="text-sm font-medium">
                Make it public
              </label>
              <p className="text-xs text-muted-foreground">Anyone signed in to Melodify can find and play it.</p>
            </div>
            <Switch id="playlist-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeCreatePlaylist} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
