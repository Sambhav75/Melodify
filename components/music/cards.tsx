'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { fetchAlbumSongs, fetchArtistSongs, fetchPlaylistSongs } from '@/lib/client-data'
import { cn, formatYear, pluralize, songCover } from '@/lib/utils'
import type { Album, ArtistMini, Playlist, Song } from '@/types'
import { CoverArt } from './cover-art'
import { LikeButton } from './like-button'
import { CollectionPlayButton, SongPlayButton } from './play-button'

const CARD_SIZES = '(max-width: 768px) 44vw, 200px'
const PLAY_POSITION = 'absolute bottom-2 right-2'

/** Artwork for a playlist: custom cover, a 2x2 mosaic of its first songs, or a generated gradient. */
export function PlaylistCover({
  playlist,
  className,
  sizes = CARD_SIZES,
}: {
  playlist: Pick<Playlist, 'id' | 'cover_image' | 'cover_urls'>
  className?: string
  sizes?: string
}) {
  const urls = playlist.cover_urls ?? []

  if (playlist.cover_image) {
    return <CoverArt src={playlist.cover_image} alt="" seed={playlist.id} variant="playlist" sizes={sizes} className={className} />
  }
  if (urls.length >= 4) {
    return (
      <div className={cn('grid aspect-square w-full grid-cols-2 grid-rows-2 overflow-hidden rounded-xl bg-muted', className)}>
        {urls.slice(0, 4).map((url, i) => (
          <CoverArt key={`${url}-${i}`} src={url} alt="" seed={`${playlist.id}${i}`} rounded="rounded-none" sizes="120px" />
        ))}
      </div>
    )
  }
  return (
    <CoverArt src={urls[0] ?? null} alt="" seed={playlist.id} variant="playlist" sizes={sizes} className={className} />
  )
}

export function SongCard({
  song,
  songs,
  index,
  source,
  note,
}: {
  song: Song
  /** The shelf this card belongs to; playing it queues the rest of the shelf. */
  songs: Song[]
  index: number
  source?: string | null
  note?: React.ReactNode
}) {
  return (
    <div className="group relative w-full">
      <div className="relative">
        <Link href={`/song/${song.id}`} prefetch={false} tabIndex={-1} className="block">
          <CoverArt
            src={songCover(song)}
            alt=""
            seed={song.album_id ?? song.id}
            sizes={CARD_SIZES}
            className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <LikeButton songId={song.id} size="sm" variant="overlay" className="absolute right-2 top-2" />
        <SongPlayButton
          songs={songs}
          index={index}
          source={source}
          size="md"
          revealOnHover
          className={PLAY_POSITION}
        />
      </div>
      <div className="mt-3 min-w-0 space-y-0.5">
        <Link href={`/song/${song.id}`} prefetch={false} className="block truncate font-semibold hover:underline">
          {song.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          <Link href={`/artist/${song.artist_id}`} prefetch={false} className="hover:text-foreground hover:underline">
            {song.artist?.name ?? 'Unknown artist'}
          </Link>
          {song.album && (
            <>
              {' · '}
              <Link href={`/album/${song.album.id}`} prefetch={false} className="hover:text-foreground hover:underline">
                {song.album.title}
              </Link>
            </>
          )}
        </p>
        {note && <p className="truncate text-xs text-muted-foreground/80">{note}</p>}
      </div>
    </div>
  )
}

export function AlbumCard({ album }: { album: Album }) {
  const label = [formatYear(album.release_date), album.album_type === 'album' ? '' : album.album_type.toUpperCase()]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group relative w-full">
      <div className="relative">
        <Link href={`/album/${album.id}`} prefetch={false} tabIndex={-1} className="block">
          <CoverArt
            src={album.cover_url}
            alt=""
            seed={album.id}
            sizes={CARD_SIZES}
            className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <CollectionPlayButton
          source={`album:${album.id}`}
          load={() => fetchAlbumSongs(album.id)}
          size="md"
          label={`Play ${album.title}`}
          revealOnHover
          className={PLAY_POSITION}
        />
      </div>
      <div className="mt-3 min-w-0 space-y-0.5">
        <Link href={`/album/${album.id}`} prefetch={false} className="block truncate font-semibold hover:underline">
          {album.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {label && <span>{label} · </span>}
          {album.artist?.name ?? 'Unknown artist'}
        </p>
      </div>
    </div>
  )
}

export function ArtistCard({ artist }: { artist: ArtistMini }) {
  return (
    <div className="group relative w-full">
      <div className="relative">
        <Link href={`/artist/${artist.id}`} prefetch={false} tabIndex={-1} className="block">
          <CoverArt
            src={artist.image_url}
            alt=""
            seed={artist.id}
            variant="artist"
            rounded="rounded-full"
            sizes={CARD_SIZES}
            className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <CollectionPlayButton
          source={`artist:${artist.id}`}
          load={() => fetchArtistSongs(artist.id)}
          size="md"
          label={`Play ${artist.name}`}
          revealOnHover
          className="absolute bottom-1 right-1"
        />
      </div>
      <div className="mt-3 min-w-0 space-y-0.5">
        <Link href={`/artist/${artist.id}`} prefetch={false} className="block truncate font-semibold hover:underline">
          {artist.name}
        </Link>
        <p className="text-sm text-muted-foreground">Artist</p>
      </div>
    </div>
  )
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const owner = playlist.owner?.username
  const details = [owner ? `By ${owner}` : null, playlist.song_count !== undefined ? pluralize(playlist.song_count, 'song') : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group relative w-full">
      <div className="relative">
        <Link href={`/playlist/${playlist.id}`} prefetch={false} tabIndex={-1} className="block">
          <PlaylistCover
            playlist={playlist}
            className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <CollectionPlayButton
          source={`playlist:${playlist.id}`}
          load={() => fetchPlaylistSongs(playlist.id)}
          size="md"
          label={`Play ${playlist.name}`}
          revealOnHover
          className={PLAY_POSITION}
        />
      </div>
      <div className="mt-3 min-w-0 space-y-0.5">
        <Link href={`/playlist/${playlist.id}`} prefetch={false} className="flex items-center gap-1.5 font-semibold hover:underline">
          <span className="truncate">{playlist.name}</span>
          {!playlist.is_public && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Private" />}
        </Link>
        <p className="truncate text-sm text-muted-foreground">{details || 'Playlist'}</p>
      </div>
    </div>
  )
}
