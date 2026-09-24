import type { Metadata } from 'next'
import Link from 'next/link'
import { Disc3, Heart, ListMusic, MicVocal } from 'lucide-react'
import { AlbumCard, ArtistCard, PlaylistCard } from '@/components/music/cards'
import { CreatePlaylistButton, CreatePlaylistTile } from '@/components/music/create-playlist-button'
import { CardGrid } from '@/components/music/shelves'
import { TrackList } from '@/components/music/track-list'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { getSupabase, requireUser } from '@/lib/data/auth'
import { getFollowedArtists, getLikedSongs, getRecentlyPlayed, getSavedAlbums } from '@/lib/data/library'
import { getLikedPlaylists, getUserPlaylists } from '@/lib/data/playlists'
import { safe } from '@/lib/data/util'
import { cn, timeAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Your Library' }

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'songs', label: 'Songs' },
  { key: 'albums', label: 'Albums' },
  { key: 'artists', label: 'Artists' },
  { key: 'recent', label: 'Recently played' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-display text-lg font-semibold md:text-xl">{children}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Show all
        </Link>
      )}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: rawFilter } = await searchParams
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : 'all'
  const user = await requireUser()
  const db = await getSupabase()

  const show = (key: Exclude<FilterKey, 'all'>) => filter === 'all' || filter === key
  const limitFor = filter === 'all' ? 6 : 60

  const [myPlaylists, savedPlaylists, liked, albums, artists, recent] = await Promise.all([
    show('playlists') ? safe(getUserPlaylists(db, user.id), 'playlists') : null,
    show('playlists') ? safe(getLikedPlaylists(db, user.id), 'saved playlists') : null,
    show('songs') ? safe(getLikedSongs(db, user.id, 0, filter === 'all' ? 8 : 50), 'liked songs') : null,
    show('albums') ? safe(getSavedAlbums(db, user.id, limitFor), 'saved albums') : null,
    show('artists') ? safe(getFollowedArtists(db, user.id, limitFor), 'followed artists') : null,
    filter === 'recent' ? safe(getRecentlyPlayed(db, user.id, 50), 'recently played') : null,
  ])

  const failed = [
    show('playlists') && myPlaylists === null,
    show('songs') && liked === null,
    show('albums') && albums === null,
    show('artists') && artists === null,
    filter === 'recent' && recent === null,
  ].some(Boolean)

  const isEmptyAll =
    filter === 'all' &&
    (myPlaylists?.length ?? 0) === 0 &&
    (savedPlaylists?.length ?? 0) === 0 &&
    (liked?.songs.length ?? 0) === 0 &&
    (albums?.length ?? 0) === 0 &&
    (artists?.length ?? 0) === 0

  return (
    <div className="px-4 pb-6 pt-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Your Library</h1>
        <CreatePlaylistButton variant="secondary" />
      </div>

      <nav aria-label="Library filters" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={item.key === 'all' ? '/library' : `/library?filter=${item.key}`}
            aria-current={filter === item.key ? 'page' : undefined}
            className={cn(
              'flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
              filter === item.key ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 space-y-12">
        {failed && <ErrorState title="Part of your library didn't load" description="Please try again in a moment." />}

        {isEmptyAll && (
          <EmptyState
            icon={ListMusic}
            title="Your library is empty"
            description="Like songs, follow artists, save albums and create playlists. They all collect here."
            action={<CreatePlaylistButton />}
          />
        )}

        {show('playlists') && ((myPlaylists?.length ?? 0) > 0 || filter === 'playlists') && (
          <section aria-label="Your playlists">
            <SectionTitle href={filter === 'all' ? '/library?filter=playlists' : undefined}>Your playlists</SectionTitle>
            <CardGrid>
              <CreatePlaylistTile />
              {(myPlaylists ?? []).slice(0, filter === 'all' ? 5 : undefined).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </CardGrid>
          </section>
        )}

        {show('playlists') && (savedPlaylists?.length ?? 0) > 0 && (
          <section aria-label="Saved playlists">
            <SectionTitle>Saved playlists</SectionTitle>
            <CardGrid>
              {(savedPlaylists ?? []).slice(0, filter === 'all' ? 6 : undefined).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </CardGrid>
          </section>
        )}

        {show('songs') && liked && (
          <section aria-label="Liked songs">
            <SectionTitle href="/liked">Liked songs</SectionTitle>
            {liked.songs.length === 0 ? (
              <EmptyState icon={Heart} title="No liked songs yet" description="Tap the heart on any song to save it here." />
            ) : (
              <>
                <TrackList songs={liked.songs} source="liked" showHeader={false} />
                {liked.total > liked.songs.length && (
                  <p className="mt-4 text-center text-sm">
                    <Link href="/liked" className="font-medium text-primary hover:underline">
                      See all {liked.total} liked songs
                    </Link>
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {show('albums') && albums && (filter !== 'all' || albums.length > 0) && (
          <section aria-label="Saved albums">
            <SectionTitle>Saved albums</SectionTitle>
            {albums.length === 0 ? (
              <EmptyState icon={Disc3} title="No saved albums" description="Save an album from its page to keep it here." />
            ) : (
              <CardGrid>
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </CardGrid>
            )}
          </section>
        )}

        {show('artists') && artists && (filter !== 'all' || artists.length > 0) && (
          <section aria-label="Followed artists">
            <SectionTitle>Followed artists</SectionTitle>
            {artists.length === 0 ? (
              <EmptyState icon={MicVocal} title="Not following anyone yet" description="Follow an artist to see them here." />
            ) : (
              <CardGrid>
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </CardGrid>
            )}
          </section>
        )}

        {filter === 'recent' && recent && (
          <section aria-label="Recently played">
            {recent.length === 0 ? (
              <EmptyState
                icon={ListMusic}
                title="Nothing played yet"
                description="Songs you listen to for a few seconds show up here, with when you last played them."
              />
            ) : (
              <TrackList
                songs={recent.map((item) => item.song)}
                source="recent"
                showHeader={false}
                notes={Object.fromEntries(recent.map((item) => [item.song.id, `played ${timeAgo(item.played_at)}`] as const))}
              />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
