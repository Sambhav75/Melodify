import type { Metadata } from 'next'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { ArtistCard, AlbumCard, PlaylistCard } from '@/components/music/cards'
import { SearchBox } from '@/components/music/search-box'
import { CardGrid } from '@/components/music/shelves'
import { TrackList } from '@/components/music/track-list'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { getSupabase } from '@/lib/data/auth'
import { searchAll } from '@/lib/data/search'
import { getGenres } from '@/lib/data/songs'
import { safe } from '@/lib/data/util'
import { gradientFor } from '@/lib/utils'
import type { SearchResults } from '@/types'

export const metadata: Metadata = { title: 'Search' }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-lg font-semibold md:text-xl">{children}</h2>
}

async function Results({ query }: { query: string }) {
  let results: SearchResults
  try {
    const db = await getSupabase()
    results = await searchAll(db, query)
  } catch (error) {
    console.error('[melodify] search failed', error)
    return (
      <ErrorState
        className="mt-10"
        title="Search is unavailable"
        description="We couldn't reach the music library. Please try again."
      />
    )
  }

  const { songs, artists, albums, playlists } = results
  if (songs.length === 0 && artists.length === 0 && albums.length === 0 && playlists.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        icon={SearchX}
        title="No results found."
        description={`We couldn't find anything for "${query}". Check the spelling or try a different word.`}
      />
    )
  }

  return (
    <div className="space-y-10 pt-8">
      {songs.length > 0 && (
        <section aria-label="Songs">
          <SectionTitle>Songs</SectionTitle>
          <TrackList songs={songs} source={`search:${query}`} showHeader={false} />
        </section>
      )}
      {artists.length > 0 && (
        <section aria-label="Artists">
          <SectionTitle>Artists</SectionTitle>
          <CardGrid>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </CardGrid>
        </section>
      )}
      {albums.length > 0 && (
        <section aria-label="Albums">
          <SectionTitle>Albums</SectionTitle>
          <CardGrid>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </CardGrid>
        </section>
      )}
      {playlists.length > 0 && (
        <section aria-label="Playlists">
          <SectionTitle>Playlists</SectionTitle>
          <CardGrid>
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </CardGrid>
        </section>
      )}
    </div>
  )
}

async function Browse() {
  const db = await getSupabase()
  const genres = (await safe(getGenres(db, 12), 'genres')) ?? []

  return (
    <div className="pt-8">
      {genres.length > 0 ? (
        <section aria-label="Browse genres">
          <SectionTitle>Browse genres</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {genres.map((genre) => (
              <Link
                key={genre}
                href={`/search?q=${encodeURIComponent(genre)}`}
                style={{ backgroundImage: gradientFor(genre) }}
                className="flex h-24 items-end rounded-2xl p-4 font-display text-base font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]"
              >
                {genre}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Start typing to search songs, artists, albums and playlists.</p>
      )}
    </div>
  )
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const query = q.trim().slice(0, 80)

  return (
    <div className="px-4 pb-6 pt-2 md:px-8">
      <SearchBox initialQuery={query} />
      {query ? <Results query={query} /> : <Browse />}
    </div>
  )
}
