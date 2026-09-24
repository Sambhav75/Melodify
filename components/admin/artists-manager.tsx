'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CoverArt } from '@/components/music/cover-art'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { FileField } from '@/components/ui/file-field'
import { Input, Textarea } from '@/components/ui/input'
import { friendlyError } from '@/lib/mutations'
import { removeFileByUrl, uploadFile, validateFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import type { Artist } from '@/types'
import { AdminHeader, AdminList, Pagination } from './admin-ui'

function ArtistFormDialog({
  open,
  onOpenChange,
  artist,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  artist: Artist | null
}) {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [biography, setBiography] = React.useState('')
  const [image, setImage] = React.useState<File | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setName(artist?.name ?? '')
    setBiography(artist?.biography ?? '')
    setImage(null)
    setError(null)
  }, [open, artist])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('A name is required.')
    if (image) {
      const problem = validateFile(image, 'image', 5)
      if (problem) return setError(problem)
    }

    setSaving(true)
    let uploadedUrl: string | null = null
    try {
      let imageUrl = artist?.image_url ?? null
      if (image) {
        const result = await uploadFile('covers', image, 'artists')
        if (!result.ok) throw new Error(`Image upload failed: ${result.error}`)
        imageUrl = result.data.url
        uploadedUrl = result.data.url
      }

      const payload = { name: name.trim(), biography: biography.trim() || null, image_url: imageUrl }
      const supabase = createClient()
      const response = artist
        ? await supabase.from('artists').update(payload).eq('id', artist.id)
        : await supabase.from('artists').insert(payload)
      if (response.error) throw new Error(friendlyError(response.error))

      if (artist && image) void removeFileByUrl('covers', artist.image_url)
      toast.success(artist ? 'Artist updated' : 'Artist created')
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      if (uploadedUrl) await removeFileByUrl('covers', uploadedUrl)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{artist ? 'Edit artist' : 'Create artist'}</DialogTitle>
          <DialogDescription>Artists own albums and songs.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {error && (
            <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Field label="Name" htmlFor="artist-name" required>
            <Input id="artist-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={saving} />
          </Field>
          <Field label="Biography" htmlFor="artist-bio">
            <Textarea id="artist-bio" value={biography} onChange={(e) => setBiography(e.target.value)} rows={5} disabled={saving} />
          </Field>
          <FileField
            label="Artist image"
            kind="image"
            accept="image/png,image/jpeg,image/webp"
            file={image}
            onChange={setImage}
            currentUrl={artist?.image_url}
            hint="Square JPG, PNG or WebP, up to 5 MB."
            disabled={saving}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {artist ? 'Save changes' : 'Create artist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ArtistsManager({
  artists,
  total,
  page,
  pageSize,
}: {
  artists: Artist[]
  total: number
  page: number
  pageSize: number
}) {
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Artist | null>(null)
  const [deleting, setDeleting] = React.useState<Artist | null>(null)
  const [busy, setBusy] = React.useState(false)

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    const supabase = createClient()

    // remember which files the cascade will orphan, so they can be cleaned up afterwards
    const [songsRes, albumsRes] = await Promise.all([
      supabase.from('songs').select('audio_url, cover_url').eq('artist_id', deleting.id),
      supabase.from('albums').select('cover_url').eq('artist_id', deleting.id),
    ])
    const songRows = (Array.isArray(songsRes.data) ? songsRes.data : []) as unknown as { audio_url: string; cover_url: string | null }[]
    const albumRows = (Array.isArray(albumsRes.data) ? albumsRes.data : []) as unknown as { cover_url: string | null }[]

    const { error } = await supabase.from('artists').delete().eq('id', deleting.id)
    if (error) {
      toast.error(friendlyError(error))
      setBusy(false)
      return
    }

    await Promise.all([
      ...songRows.map((s) => removeFileByUrl('audio', s.audio_url)),
      ...songRows.map((s) => removeFileByUrl('covers', s.cover_url)),
      ...albumRows.map((a) => removeFileByUrl('covers', a.cover_url)),
      removeFileByUrl('covers', deleting.image_url),
    ])

    toast.success(`Deleted ${deleting.name}`)
    setBusy(false)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <AdminHeader
        title="Artists"
        description={`${total} artist${total === 1 ? '' : 's'}`}
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Create artist
          </Button>
        }
      />

      <AdminList isEmpty={artists.length === 0} emptyText="No artists yet. Create one, then add albums and songs.">
        {artists.map((artist) => (
          <li key={artist.id} className="flex items-center gap-3 p-3">
            <CoverArt
              src={artist.image_url}
              alt=""
              seed={artist.id}
              variant="artist"
              rounded="rounded-full"
              sizes="48px"
              className="h-12 w-12 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Link href={`/artist/${artist.id}`} className="block truncate font-medium hover:underline">
                {artist.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">{artist.biography ?? 'No biography'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${artist.name}`}
              onClick={() => {
                setEditing(artist)
                setFormOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${artist.name}`} onClick={() => setDeleting(artist)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </AdminList>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/admin/artists" />

      <ArtistFormDialog open={formOpen} onOpenChange={setFormOpen} artist={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'artist'}?`}
        description="This also deletes all of their albums and songs (and the uploaded files). It cannot be undone."
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
