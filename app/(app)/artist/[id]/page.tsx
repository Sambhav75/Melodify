import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CoverArt } from '@/components/music/cover-art'
import { EntityHeader } from '@/components/music/entity-header'
import { FollowButton } from '@/components/music/like-button'
import { CollectionPlayButton } from '@/components/music/play-button'
import { ShareButton } from '@/components/music/share-button'
import { AlbumShelf } from '@/components/music/shelves'
import { TrackList } from '@/components/music/track-list'
import { getArtistAlbums, getArtist, getArtistTopSongs } from '@/lib/data/artists'
import { getSupabase } from '@/lib/data/auth'
import { isUuid, pluralize } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Artist not found' }
  const artist = await getArtist(id)
  return { title: artist ? artist.name : 'Artist not found' }
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const artist = await getArtist(id)
  if (!artist) notFound()

  const db = await getSupabase()
  const [topSongs, allAlbums] = await Promise.all([getArtistTopSongs(db, id, 10), getArtistAlbums(db, id)])
  const albums = allAlbums.filter((a) => a.album_type !== 'single')
  const singles = allAlbums.filter((a) => a.album_type === 'single')

  return (
    <>
      <EntityHeader
        seed={artist.id}
        kind="Artist"
        title={artist.name}
        cover={
          <CoverArt
            src={artist.image_url}
            alt={`Photo of ${artist.name}`}
            seed={artist.id}
            variant="artist"
            sizes="240px"
            priority
            rounded="rounded-full"
            className="shadow-2xl shadow-black/50"
          />
        }
        meta={[
          albums.length > 0 ? pluralize(albums.length, 'album') : null,
          singles.length > 0 ? pluralize(singles.length, 'single') : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      >
        <CollectionPlayButton source={`artist:${artist.id}`} songs={topSongs} label={`Play ${artist.name}`} />
        <FollowButton artistId={artist.id} />
        <ShareButton path={`/artist/${artist.id}`} title={artist.name} />
      </EntityHeader>

      {topSongs.length > 0 && (
        <section className="px-4 pb-4 pt-6 md:px-8" aria-label="Popular songs">
          <h2 className="mb-3 font-display text-lg font-semibold md:text-xl">Popular</h2>
          <TrackList songs={topSongs} source={`artist:${artist.id}`} showHeader={false} />
        </section>
      )}

      {albums.length > 0 && <AlbumShelf title="Albums" albums={albums} />}
      {singles.length > 0 && <AlbumShelf title="Singles" albums={singles} />}

      {artist.biography && (
        <section className="px-4 pb-8 pt-4 md:px-8" aria-label="About">
          <h2 className="mb-3 font-display text-lg font-semibold md:text-xl">About</h2>
          <p className="max-w-2xl whitespace-pre-line text-muted-foreground">{artist.biography}</p>
        </section>
      )}
    </>
  )
}
