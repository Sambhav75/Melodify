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
import { Input, Select } from '@/components/ui/input'
import { friendlyError } from '@/lib/mutations'
import { removeFileByUrl, uploadFile, validateFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { formatYear } from '@/lib/utils'
import type { Album, AlbumType } from '@/types'
import { AdminHeader, AdminList, Pagination, type ArtistOption } from './admin-ui'

function AlbumFormDialog({
  open,
  onOpenChange,
  album,
  artists,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  album: Album | null
  artists: ArtistOption[]
}) {
  const router = useRouter()
  const [title, setTitle] = React.useState('')
  const [artistId, setArtistId] = React.useState('')
  const [albumType, setAlbumType] = React.useState<AlbumType>('album')
  const [releaseDate, setReleaseDate] = React.useState('')
  const [cover, setCover] = React.useState<File | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setTitle(album?.title ?? '')
    setArtistId(album?.artist_id ?? '')
    setAlbumType(album?.album_type ?? 'album')
    setReleaseDate(album?.release_date ?? '')
    setCover(null)
    setError(null)
  }, [open, album])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('A title is required.')
    if (!artistId) return setError('Choose an artist.')
    if (cover) {
      const problem = validateFile(cover, 'image', 5)
      if (problem) return setError(problem)
    }

    setSaving(true)
    let uploadedUrl: string | null = null
    try {
      let coverUrl = album?.cover_url ?? null
      if (cover) {
        const result = await uploadFile('covers', cover, 'albums')
        if (!result.ok) throw new Error(`Artwork upload failed: ${result.error}`)
        coverUrl = result.data.url
        uploadedUrl = result.data.url
      }

      const payload = {
        title: title.trim(),
        artist_id: artistId,
        album_type: albumType,
        release_date: releaseDate || null,
        cover_url: coverUrl,
      }
      const supabase = createClient()
      const response = album
        ? await supabase.from('albums').update(payload).eq('id', album.id)
        : await supabase.from('albums').insert(payload)
      if (response.error) throw new Error(friendlyError(response.error))

      if (album && cover) void removeFileByUrl('covers', album.cover_url)
      toast.success(album ? 'Album updated' : 'Album created')
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
          <DialogTitle>{album ? 'Edit album' : 'Create album'}</DialogTitle>
          <DialogDescription>Singles and EPs are albums too. Pick the type below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {error && (
            <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Field label="Title" htmlFor="album-title" required>
            <Input id="album-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={saving} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist" htmlFor="album-artist" required>
              <Select id="album-artist" value={artistId} onChange={(e) => setArtistId(e.target.value)} disabled={saving}>
                <option value="">Choose an artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type" htmlFor="album-type">
              <Select id="album-type" value={albumType} onChange={(e) => setAlbumType(e.target.value as AlbumType)} disabled={saving}>
                <option value="album">Album</option>
                <option value="ep">EP</option>
                <option value="single">Single</option>
              </Select>
            </Field>
          </div>
          <Field label="Release date" htmlFor="album-date">
            <Input id="album-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} disabled={saving} />
          </Field>
          <FileField
            label="Album artwork"
            kind="image"
            accept="image/png,image/jpeg,image/webp"
            file={cover}
            onChange={setCover}
            currentUrl={album?.cover_url}
            hint="Square JPG, PNG or WebP, up to 5 MB."
            disabled={saving}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {album ? 'Save changes' : 'Create album'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AlbumsManager({
  albums,
  total,
  page,
  pageSize,
  artists,
}: {
  albums: Album[]
  total: number
  page: number
  pageSize: number
  artists: ArtistOption[]
}) {
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Album | null>(null)
  const [deleting, setDeleting] = React.useState<Album | null>(null)
  const [busy, setBusy] = React.useState(false)

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    const { error } = await createClient().from('albums').delete().eq('id', deleting.id)
    if (error) {
      toast.error(friendlyError(error))
      setBusy(false)
      return
    }
    await removeFileByUrl('covers', deleting.cover_url)
    toast.success(`Deleted "${deleting.title}"`)
    setBusy(false)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <AdminHeader
        title="Albums"
        description={`${total} album${total === 1 ? '' : 's'}, EPs and singles`}
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Create album
          </Button>
        }
      />

      <AdminList isEmpty={albums.length === 0} emptyText="No albums yet. Create an artist first, then add an album.">
        {albums.map((album) => (
          <li key={album.id} className="flex items-center gap-3 p-3">
            <CoverArt src={album.cover_url} alt="" seed={album.id} sizes="48px" rounded="rounded-lg" className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <Link href={`/album/${album.id}`} className="block truncate font-medium hover:underline">
                {album.title}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {album.artist?.name ?? 'Unknown artist'} &middot; {album.album_type.toUpperCase()}
                {album.release_date && ` · ${formatYear(album.release_date)}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${album.title}`}
              onClick={() => {
                setEditing(album)
                setFormOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${album.title}`} onClick={() => setDeleting(album)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </AdminList>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/admin/albums" />

      <AlbumFormDialog open={formOpen} onOpenChange={setFormOpen} album={editing} artists={artists} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title ?? 'album'}"?`}
        description="The album is removed. Its songs stay in the library, they just won't belong to an album anymore."
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
