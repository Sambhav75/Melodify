import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EntityHeader } from '@/components/music/entity-header'
import { PlaylistCover } from '@/components/music/cards'
import { PlaylistActions } from '@/components/music/playlist-actions'
import { PlaylistTracks } from '@/components/music/playlist-tracks'
import { getSupabase, requireUser } from '@/lib/data/auth'
import { getPlaylist, getPlaylistTracks } from '@/lib/data/playlists'
import { formatTotalDuration, isUuid, pluralize, songCover, sumDuration } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Playlist not found' }
  const playlist = await getPlaylist(id)
  return { title: playlist ? playlist.name : 'Playlist not found' }
}

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const user = await requireUser()
  // Row Level Security hides private playlists that belong to somebody else -> null -> 404
  const playlist = await getPlaylist(id)
  if (!playlist) notFound()

  const db = await getSupabase()
  const tracks = await getPlaylistTracks(db, id)
  const songs = tracks.map((t) => t.song)
  const isOwner = playlist.user_id === user.id

  const coverUrls = songs
    .slice(0, 4)
    .map((song) => songCover(song))
    .filter((url): url is string => Boolean(url))

  return (
    <>
      <EntityHeader
        seed={playlist.id}
        kind={playlist.is_public ? 'Public playlist' : 'Private playlist'}
        title={playlist.name}
        cover={
          <PlaylistCover
            playlist={{ id: playlist.id, cover_image: playlist.cover_image, cover_urls: coverUrls }}
            sizes="240px"
            className="shadow-2xl shadow-black/50"
          />
        }
        subtitle={playlist.description ? <p className="mx-auto max-w-xl whitespace-pre-line md:mx-0">{playlist.description}</p> : undefined}
        meta={
          <>
            {playlist.owner && <span className="font-medium text-foreground">{playlist.owner.username}</span>}
            {playlist.owner && ' · '}
            {pluralize(songs.length, 'song')}
            {songs.length > 0 && `, ${formatTotalDuration(sumDuration(songs))}`}
          </>
        }
      >
        <PlaylistActions playlist={playlist} songs={songs} isOwner={isOwner} />
      </EntityHeader>

      <section className="px-4 pb-8 pt-4 md:px-8" aria-label="Tracks">
        <PlaylistTracks playlistId={playlist.id} tracks={tracks} isOwner={isOwner} />
      </section>
    </>
  )
}
