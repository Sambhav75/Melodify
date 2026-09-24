import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
import { EntityHeader } from '@/components/music/entity-header'
import { LikedActions } from '@/components/music/liked-actions'
import { LikedCount, LikedSongsList } from '@/components/music/liked-songs-list'
import { getProfile, getSupabase, requireUser } from '@/lib/data/auth'
import { getLikedSongs } from '@/lib/data/library'

export const metadata: Metadata = { title: 'Liked Songs' }

const PAGE_SIZE = 50

export default async function LikedSongsPage() {
  const user = await requireUser()
  const profile = await getProfile()
  const db = await getSupabase()
  const { songs } = await getLikedSongs(db, user.id, 0, PAGE_SIZE)

  return (
    <>
      <EntityHeader
        seed="liked-songs"
        kind="Playlist"
        title="Liked Songs"
        cover={
          <div className="grid aspect-square w-full place-items-center rounded-2xl bg-brand-gradient shadow-2xl shadow-black/50">
            <Heart className="h-1/3 w-1/3 fill-current text-primary-foreground" />
          </div>
        }
        subtitle={
          <>
            <span className="font-medium text-foreground">{profile?.username ?? 'You'}</span> &middot; <LikedCount />
          </>
        }
      >
        <LikedActions />
      </EntityHeader>
      <section className="px-4 pb-8 pt-4 md:px-8" aria-label="Liked songs">
        <LikedSongsList initialSongs={songs} pageSize={PAGE_SIZE} />
      </section>
    </>
  )
}
