import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Disc3 } from 'lucide-react'
import { AddToPlaylistButton } from '@/components/music/add-to-playlist-button'
import { CoverArt } from '@/components/music/cover-art'
import { EntityHeader } from '@/components/music/entity-header'
import { SaveAlbumButton } from '@/components/music/like-button'
import { CollectionPlayButton } from '@/components/music/play-button'
import { ShareButton } from '@/components/music/share-button'
import { TrackList } from '@/components/music/track-list'
import { EmptyState } from '@/components/ui/empty-state'
import { getAlbum, getAlbumTracks } from '@/lib/data/albums'
import { getSupabase } from '@/lib/data/auth'
import { formatDate, formatTotalDuration, formatYear, isUuid, pluralize, sumDuration } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

const KIND = { album: 'Album', single: 'Single', ep: 'EP' } as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Album not found' }
  const album = await getAlbum(id)
  return { title: album ? `${album.title} - ${album.artist?.name ?? 'Unknown artist'}` : 'Album not found' }
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const album = await getAlbum(id)
  if (!album) notFound()

  const db = await getSupabase()
  const tracks = await getAlbumTracks(db, id)

  return (
    <>
      <EntityHeader
        seed={album.id}
        kind={KIND[album.album_type] ?? 'Album'}
        title={album.title}
        cover={
          <CoverArt
            src={album.cover_url}
            alt={`Artwork for ${album.title}`}
            seed={album.id}
            sizes="240px"
            priority
            rounded="rounded-2xl"
            className="shadow-2xl shadow-black/50"
          />
        }
        subtitle={
          <>
            <Link href={`/artist/${album.artist_id}`} className="font-medium text-foreground hover:underline">
              {album.artist?.name ?? 'Unknown artist'}
            </Link>
            {album.release_date && ` · ${formatYear(album.release_date)}`}
          </>
        }
        meta={
          <>
            {pluralize(tracks.length, 'song')}
            {tracks.length > 0 && `, ${formatTotalDuration(sumDuration(tracks))}`}
          </>
        }
      >
        <CollectionPlayButton source={`album:${album.id}`} songs={tracks} label={`Play ${album.title}`} />
        <SaveAlbumButton albumId={album.id} />
        <AddToPlaylistButton songs={tracks} label="Add all to playlist" variant="outline" />
        <ShareButton path={`/album/${album.id}`} title={album.title} />
      </EntityHeader>

      <section className="px-4 pb-8 pt-4 md:px-8" aria-label="Track list">
        {tracks.length === 0 ? (
          <EmptyState icon={Disc3} title="No tracks yet" description="Songs added to this album will appear here." />
        ) : (
          <>
            <TrackList songs={tracks} source={`album:${album.id}`} showAlbum={false} showCover={false} />
            {album.release_date && (
              <p className="mt-6 px-3 text-xs text-muted-foreground">Released {formatDate(album.release_date)}</p>
            )}
          </>
        )}
      </section>
    </>
  )
}
