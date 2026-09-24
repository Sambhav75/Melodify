import type { Metadata } from 'next'
import { ListMusic } from 'lucide-react'
import { PlaylistCard } from '@/components/music/cards'
import { CreatePlaylistButton, CreatePlaylistTile } from '@/components/music/create-playlist-button'
import { CardGrid } from '@/components/music/shelves'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { getSupabase, requireUser } from '@/lib/data/auth'
import { getLikedPlaylists, getPublicPlaylists, getUserPlaylists } from '@/lib/data/playlists'
import { safe } from '@/lib/data/util'

export const metadata: Metadata = { title: 'Playlists' }

export default async function PlaylistsPage() {
  const user = await requireUser()
  const db = await getSupabase()

  const [mine, saved, community] = await Promise.all([
    safe(getUserPlaylists(db, user.id), 'your playlists'),
    safe(getLikedPlaylists(db, user.id), 'saved playlists'),
    safe(getPublicPlaylists(db, user.id, 24), 'public playlists'),
  ])

  return (
    <div className="space-y-12 px-4 pb-6 pt-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Playlists</h1>
        <CreatePlaylistButton />
      </div>

      <section aria-label="Your playlists">
        <h2 className="mb-4 font-display text-lg font-semibold md:text-xl">Your playlists</h2>
        {mine === null ? (
          <ErrorState title="Couldn't load your playlists" />
        ) : (
          <CardGrid>
            <CreatePlaylistTile />
            {mine.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </CardGrid>
        )}
      </section>

      {saved && saved.length > 0 && (
        <section aria-label="Saved playlists">
          <h2 className="mb-4 font-display text-lg font-semibold md:text-xl">Saved playlists</h2>
          <CardGrid>
            {saved.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </CardGrid>
        </section>
      )}

      <section aria-label="Public playlists">
        <h2 className="mb-4 font-display text-lg font-semibold md:text-xl">Discover public playlists</h2>
        {community === null ? (
          <ErrorState title="Couldn't load public playlists" />
        ) : community.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No public playlists yet"
            description="When people make their playlists public, they show up here."
          />
        ) : (
          <CardGrid>
            {community.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </CardGrid>
        )}
      </section>
    </div>
  )
}
