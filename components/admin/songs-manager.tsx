'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { CoverArt } from '@/components/music/cover-art'
import { SongPlayButton } from '@/components/music/play-button'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { FileField } from '@/components/ui/file-field'
import { Input, Select } from '@/components/ui/input'
import { friendlyError } from '@/lib/mutations'
import { getAudioDuration, removeFileByUrl, uploadFile, validateFile, type Bucket } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, songCover } from '@/lib/utils'
import type { Song } from '@/types'
import { AdminHeader, AdminList, Pagination, type AlbumOption, type ArtistOption } from './admin-ui'

function SongFormDialog({
  open,
  onOpenChange,
  song,
  artists,
  albums,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  artists: ArtistOption[]
  albums: AlbumOption[]
}) {
  const router = useRouter()
  const [title, setTitle] = React.useState('')
  const [artistId, setArtistId] = React.useState('')
  const [albumId, setAlbumId] = React.useState('')
  const [genre, setGenre] = React.useState('')
  const [releaseDate, setReleaseDate] = React.useState('')
  const [trackNumber, setTrackNumber] = React.useState('')
  const [audio, setAudio] = React.useState<File | null>(null)
  const [cover, setCover] = React.useState<File | null>(null)
  const [duration, setDuration] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [stage, setStage] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setTitle(song?.title ?? '')
    setArtistId(song?.artist_id ?? '')
    setAlbumId(song?.album_id ?? '')
    setGenre(song?.genre ?? '')
    setReleaseDate(song?.release_date ?? '')
    setTrackNumber(song?.track_number ? String(song.track_number) : '')
    setAudio(null)
    setCover(null)
    setDuration(song?.duration ?? 0)
    setError(null)
    setStage('')
  }, [open, song])

  const albumOptions = albums.filter((a) => a.artist_id === artistId)

  const handleAudio = async (file: File | null) => {
    setAudio(file)
    if (!file) return
    setDuration(await getAudioDuration(file))
    setTitle((current) => current.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) return setError('A title is required.')
    if (!artistId) return setError('Choose an artist. Create one first if the list is empty.')
    if (!song && !audio) return setError('Choose an audio file to upload.')
    if (audio) {
      const problem = validateFile(audio, 'audio', 50)
      if (problem) return setError(problem)
    }
    if (cover) {
      const problem = validateFile(cover, 'image', 5)
      if (problem) return setError(problem)
    }

    setSaving(true)
    const uploaded: { bucket: Bucket; url: string }[] = []
    try {
      let audioUrl = song?.audio_url ?? ''
      let coverUrl = song?.cover_url ?? null

      if (audio) {
        setStage('Uploading audio...')
        const result = await uploadFile('audio', audio, 'tracks')
        if (!result.ok) throw new Error(`Audio upload failed: ${result.error}`)
        audioUrl = result.data.url
        uploaded.push({ bucket: 'audio', url: result.data.url })
      }
      if (cover) {
        setStage('Uploading artwork...')
        const result = await uploadFile('covers', cover, 'songs')
        if (!result.ok) throw new Error(`Artwork upload failed: ${result.error}`)
        coverUrl = result.data.url
        uploaded.push({ bucket: 'covers', url: result.data.url })
      }

      setStage('Saving...')
      const payload = {
        title: title.trim(),
        artist_id: artistId,
        album_id: albumId || null,
        genre: genre.trim() || null,
        release_date: releaseDate || null,
        track_number: trackNumber ? Number(trackNumber) : null,
        audio_url: audioUrl,
        cover_url: coverUrl,
        ...(audio ? { duration } : {}),
      }
      const supabase = createClient()
      const response = song
        ? await supabase.from('songs').update(payload).eq('id', song.id)
        : await supabase.from('songs').insert({ ...payload, duration })
      if (response.error) throw new Error(friendlyError(response.error))

      // the old files are no longer referenced
      if (song && audio) void removeFileByUrl('audio', song.audio_url)
      if (song && cover && song.cover_url && song.cover_url !== song.album?.cover_url) {
        void removeFileByUrl('covers', song.cover_url)
      }

      toast.success(song ? 'Song updated' : 'Song uploaded')
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      // roll back files uploaded during this attempt so nothing is left orphaned
      await Promise.all(uploaded.map((file) => removeFileByUrl(file.bucket, file.url)))
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
      setStage('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{song ? 'Edit song' : 'Upload song'}</DialogTitle>
          <DialogDescription>
            {song ? 'Change details, or replace the audio / artwork.' : 'Audio goes to Supabase Storage (max 50 MB on the free plan).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          {error && (
            <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <FileField
            label={song ? 'Replace audio file' : 'Audio file'}
            kind="audio"
            accept="audio/*"
            file={audio}
            onChange={(file) => void handleAudio(file)}
            currentUrl={song?.audio_url}
            hint={audio ? `Detected length: ${formatDuration(duration)}` : 'MP3, WAV, OGG, FLAC or M4A'}
            required={!song}
            disabled={saving}
          />

          <Field label="Title" htmlFor="song-title" required>
            <Input id="song-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={saving} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist" htmlFor="song-artist" required>
              <Select
                id="song-artist"
                value={artistId}
                onChange={(e) => {
                  setArtistId(e.target.value)
                  setAlbumId('')
                }}
                disabled={saving}
              >
                <option value="">Choose an artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Album" htmlFor="song-album" hint={artistId && albumOptions.length === 0 ? 'This artist has no albums yet.' : undefined}>
              <Select id="song-album" value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={saving || !artistId}>
                <option value="">No album</option>
                {albumOptions.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Genre" htmlFor="song-genre">
              <Input id="song-genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Lo-fi" disabled={saving} />
            </Field>
            <Field label="Release date" htmlFor="song-date">
              <Input id="song-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} disabled={saving} />
            </Field>
            <Field label="Track #" htmlFor="song-track">
              <Input
                id="song-track"
                type="number"
                min={1}
                max={999}
                inputMode="numeric"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                disabled={saving}
              />
            </Field>
          </div>

          <FileField
            label="Artwork (optional)"
            kind="image"
            accept="image/png,image/jpeg,image/webp"
            file={cover}
            onChange={setCover}
            currentUrl={song?.cover_url}
            hint="Square JPG, PNG or WebP, up to 5 MB. Empty = use the album cover."
            disabled={saving}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {saving ? stage || 'Working...' : song ? 'Save changes' : 'Upload song'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SongsManager({
  songs,
  total,
  page,
  pageSize,
  artists,
  albums,
}: {
  songs: Song[]
  total: number
  page: number
  pageSize: number
  artists: ArtistOption[]
  albums: AlbumOption[]
}) {
  const router = useRouter()
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Song | null>(null)
  const [deleting, setDeleting] = React.useState<Song | null>(null)
  const [busy, setBusy] = React.useState(false)

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    const { error } = await createClient().from('songs').delete().eq('id', deleting.id)
    if (error) {
      toast.error(friendlyError(error))
      setBusy(false)
      return
    }
    await removeFileByUrl('audio', deleting.audio_url)
    if (deleting.cover_url && deleting.cover_url !== deleting.album?.cover_url) {
      await removeFileByUrl('covers', deleting.cover_url)
    }
    toast.success(`Deleted "${deleting.title}"`)
    setBusy(false)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <AdminHeader
        title="Songs"
        description={`${total} song${total === 1 ? '' : 's'} in the library`}
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Upload className="h-4 w-4" />
            Upload song
          </Button>
        }
      />

      <AdminList isEmpty={songs.length === 0} emptyText="No songs yet. Upload your first track (create an artist first).">
        {songs.map((song) => (
          <li key={song.id} className="flex items-center gap-3 p-3">
            <CoverArt
              src={songCover(song)}
              alt=""
              seed={song.album_id ?? song.id}
              sizes="48px"
              rounded="rounded-lg"
              className="h-12 w-12 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{song.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {song.artist?.name ?? 'Unknown artist'} &middot; {song.album?.title ?? 'No album'} &middot;{' '}
                {song.genre ?? 'No genre'}
              </p>
            </div>
            <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">{formatDuration(song.duration)}</span>
            <SongPlayButton songs={[song]} source={`admin:${song.id}`} size="sm" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${song.title}`}
              onClick={() => {
                setEditing(song)
                setFormOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${song.title}`} onClick={() => setDeleting(song)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </AdminList>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/admin/songs" />

      <SongFormDialog open={formOpen} onOpenChange={setFormOpen} song={editing} artists={artists} albums={albums} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ''}"?`}
        description="The song is removed from every playlist and like list, and its audio file is deleted from storage."
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
