'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { FileField } from '@/components/ui/file-field'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useLibrary } from '@/contexts/library-context'
import { updatePlaylist } from '@/lib/mutations'
import { removeFileByUrl, uploadFile, validateFile } from '@/lib/storage'
import type { Playlist } from '@/types'

export function EditPlaylistDialog({
  playlist,
  open,
  onOpenChange,
}: {
  playlist: Playlist
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { patchPlaylist } = useLibrary()
  const [name, setName] = React.useState(playlist.name)
  const [description, setDescription] = React.useState(playlist.description ?? '')
  const [isPublic, setIsPublic] = React.useState(playlist.is_public)
  const [cover, setCover] = React.useState<File | null>(null)
  const [removeCover, setRemoveCover] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setName(playlist.name)
      setDescription(playlist.description ?? '')
      setIsPublic(playlist.is_public)
      setCover(null)
      setRemoveCover(false)
      setError(null)
    }
  }, [open, playlist])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (cover) {
      const problem = validateFile(cover, 'image', 3)
      if (problem) {
        setError(problem)
        return
      }
    }

    setSaving(true)
    let coverImage: string | null | undefined = undefined
    if (cover) {
      const uploaded = await uploadFile('playlist-covers', cover, playlist.user_id)
      if (!uploaded.ok) {
        setSaving(false)
        setError(`Cover upload failed: ${uploaded.error}`)
        return
      }
      coverImage = uploaded.data.url
    } else if (removeCover) {
      coverImage = null
    }

    const result = await updatePlaylist(playlist.id, {
      name,
      description: description.trim() || null,
      is_public: isPublic,
      ...(coverImage !== undefined ? { cover_image: coverImage } : {}),
    })
    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    if (coverImage !== undefined) void removeFileByUrl('playlist-covers', playlist.cover_image)
    patchPlaylist({
      id: playlist.id,
      name: name.trim(),
      is_public: isPublic,
      cover_image: coverImage === undefined ? playlist.cover_image : coverImage,
    })
    toast.success('Playlist updated')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
          <DialogDescription>Rename it, change its visibility or give it a cover.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Name" htmlFor="edit-playlist-name" required error={error}>
            <Input id="edit-playlist-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
          </Field>
          <Field label="Description" htmlFor="edit-playlist-description">
            <Textarea
              id="edit-playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </Field>
          <FileField
            label="Cover image"
            kind="image"
            accept="image/png,image/jpeg,image/webp"
            file={cover}
            onChange={(file) => {
              setCover(file)
              if (file) setRemoveCover(false)
            }}
            currentUrl={removeCover ? null : playlist.cover_image}
            hint="JPG, PNG or WebP, up to 3 MB. Leave empty for an automatic cover."
            disabled={saving}
          />
          {playlist.cover_image && !cover && (
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setRemoveCover((v) => !v)}>
              {removeCover ? 'Keep current cover' : 'Use automatic cover instead'}
            </Button>
          )}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <label htmlFor="edit-playlist-public" className="text-sm font-medium">
                Public playlist
              </label>
              <p className="text-xs text-muted-foreground">Anyone signed in can find and play it.</p>
            </div>
            <Switch id="edit-playlist-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
