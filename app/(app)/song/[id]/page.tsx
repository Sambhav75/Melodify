import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToPlaylistButton } from '@/components/music/add-to-playlist-button'
import { CoverArt } from '@/components/music/cover-art'
import { EntityHeader } from '@/components/music/entity-header'
import { LikeButton } from '@/components/music/like-button'
import { CollectionPlayButton } from '@/components/music/play-button'
import { ShareButton } from '@/components/music/share-button'
import { TrackList } from '@/components/music/track-list'
import { getSupabase } from '@/lib/data/auth'
import { getRelatedSongs, getSong } from '@/lib/data/songs'
import { safe } from '@/lib/data/util'
import { formatDate, formatDuration, isUuid, songCover } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Song not found' }
  const song = await getSong(id)
  return { title: song ? `${song.title} - ${song.artist?.name ?? 'Unknown artist'}` : 'Song not found' }
}

export default async function SongPage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const song = await getSong(id)
  if (!song) notFound()

  const db = await getSupabase()
  const related = (await safe(getRelatedSongs(db, song, 10), 'related songs')) ?? []
  const details = [
    formatDuration(song.duration),
    song.release_date ? formatDate(song.release_date) : null,
    song.genre,
    `${song.play_count.toLocaleString('en-US')} plays`,
  ].filter(Boolean)

  return (
    <>
      <EntityHeader
        seed={song.album_id ?? song.id}
        kind="Song"
        title={song.title}
        cover={
          <CoverArt
            src={songCover(song)}
            alt={`Artwork for ${song.title}`}
            seed={song.album_id ?? song.id}
            sizes="240px"
            priority
            rounded="rounded-2xl"
            className="shadow-2xl shadow-black/50"
          />
        }
        subtitle={
          <>
            <Link href={`/artist/${song.artist_id}`} className="font-medium text-foreground hover:underline">
              {song.artist?.name ?? 'Unknown artist'}
            </Link>
            {song.album && (
              <>
                {' · '}
                <Link href={`/album/${song.album.id}`} className="hover:text-foreground hover:underline">
                  {song.album.title}
                </Link>
              </>
            )}
          </>
        }
        meta={details.join(' · ')}
      >
        {/* plays the song first, then keeps going through related songs */}
        <CollectionPlayButton source={`song:${song.id}`} songs={[song, ...related]} label={`Play ${song.title}`} />
        <LikeButton songId={song.id} size="lg" />
        <AddToPlaylistButton songs={[song]} />
        <ShareButton path={`/song/${song.id}`} title={song.title} />
      </EntityHeader>

      <section className="px-4 pb-8 pt-6 md:px-8" aria-label="Related songs">
        <h2 className="mb-3 font-display text-lg font-semibold md:text-xl">Related songs</h2>
        {related.length > 0 ? (
          <TrackList songs={related} source={`related:${song.id}`} showHeader={false} />
        ) : (
          <p className="text-sm text-muted-foreground">No related songs yet.</p>
        )}
      </section>
    </>
  )
}
