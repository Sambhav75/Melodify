import { SongsManager } from '@/components/admin/songs-manager'
import { ADMIN_PAGE_SIZE, getAdminSongs, getAlbumOptions, getArtistOptions } from '@/lib/data/admin'
import { getSupabase } from '@/lib/data/auth'

export default async function AdminSongsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1)
  const db = await getSupabase()

  const [songs, artists, albums] = await Promise.all([getAdminSongs(db, page), getArtistOptions(db), getAlbumOptions(db)])

  return (
    <SongsManager
      songs={songs.items}
      total={songs.total}
      page={page}
      pageSize={ADMIN_PAGE_SIZE}
      artists={artists}
      albums={albums}
    />
  )
}
