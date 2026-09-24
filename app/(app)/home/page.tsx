import type { Metadata } from 'next'
import { Disc3 } from 'lucide-react'
import { Greeting } from '@/components/music/greeting'
import { AlbumShelf, ArtistShelf, PlaylistShelf, SongShelf } from '@/components/music/shelves'
import { TrackList } from '@/components/music/track-list'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { getRecentAlbums } from '@/lib/data/albums'
import { getArtists } from '@/lib/data/artists'
import { getProfile, getSupabase, requireUser } from '@/lib/data/auth'
import { getRecentlyPlayed } from '@/lib/data/library'
import { getPublicPlaylists, getUserPlaylists } from '@/lib/data/playlists'
import { getRecommendations } from '@/lib/data/recommendations'
import { getPopularSongs, getRecentSongs } from '@/lib/data/songs'
import { safe } from '@/lib/data/util'

export const metadata: Metadata = { title: 'Home' }

export default async function HomePage() {
  const user = await requireUser()
  const profile = await getProfile()
  const db = await getSupabase()

  // Every shelf loads independently, so one failing query never blanks the page.
  const [recent, recommended, added, popular, albums, artists, playlists, community] = await Promise.all([
    safe(getRecentlyPlayed(db, user.id, 12), 'recently played'),
    safe(getRecommendations(db, user.id, 12), 'recommendations'),
    safe(getRecentSongs(db, 12), 'recently added'),
    safe(getPopularSongs(db, 8), 'popular tracks'),
    safe(getRecentAlbums(db, 12), 'albums'),
    safe(getArtists(db, 12), 'artists'),
    safe(getUserPlaylists(db, user.id), 'your playlists'),
    safe(getPublicPlaylists(db, user.id, 12), 'public playlists'),
  ])

  const nothingLoaded = [recent, recommended, added, popular, albums, artists].every((result) => result === null)
  const catalogEmpty = added !== null && added.length === 0

  return (
    <div className="pb-6">
      <div className="ambient px-4 pb-2 pt-8 md:px-8">
        <Greeting name={profile?.username ?? 'there'} />
      </div>

      {nothingLoaded ? (
        <div className="px-4 py-10 md:px-8">
          <ErrorState
            title="We couldn't load your music"
            description="The music library isn't responding right now. Check your connection and try again."
          />
        </div>
      ) : catalogEmpty ? (
        <div className="px-4 py-10 md:px-8">
          <EmptyState
            icon={Disc3}
            title="No music here yet"
            description="Run supabase/seed.sql for sample tracks, or upload songs from the Admin dashboard."
          />
        </div>
      ) : (
        <>
          {recent && recent.length > 0 && (
            <SongShelf
              title="Recently played"
              subtitle="Jump back in"
              songs={recent.map((item) => item.song)}
              source="recent"
              playedAt={Object.fromEntries(recent.map((item) => [item.song.id, item.played_at] as const))}
            />
          )}

          {recommended && recommended.songs.length > 0 && (
            <SongShelf
              title="Recommended for you"
              subtitle={recommended.reason ?? 'Popular right now'}
              songs={recommended.songs}
              source="recommended"
            />
          )}

          {popular && popular.length > 0 && (
            <section className="px-4 py-4 md:px-8" aria-label="Popular tracks">
              <h2 className="mb-3 font-display text-lg font-semibold md:text-xl">Popular tracks</h2>
              <TrackList songs={popular} source="popular" showHeader={false} />
            </section>
          )}

          {added && added.length > 0 && (
            <SongShelf title="Recently added" subtitle="Fresh in the library" songs={added} source="added" />
          )}

          {albums && albums.length > 0 && <AlbumShelf title="Albums & singles" albums={albums} />}

          {recommended && recommended.artists.length > 0 && (
            <ArtistShelf title="Artists you might like" subtitle="Based on what you listen to" artists={recommended.artists} />
          )}

          {artists && artists.length > 0 && <ArtistShelf title="Artists" artists={artists} />}

          {playlists && playlists.length > 0 && (
            <PlaylistShelf title="Your playlists" href="/playlists" playlists={playlists} />
          )}

          {community && community.length > 0 && (
            <PlaylistShelf title="Public playlists" subtitle="Made by the community" href="/playlists" playlists={community} />
          )}
        </>
      )}
    </div>
  )
}
