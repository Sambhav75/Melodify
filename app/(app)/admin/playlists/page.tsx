import { PlaylistsManager } from '@/components/admin/playlists-manager'
import { ADMIN_PAGE_SIZE, getAdminPlaylists } from '@/lib/data/admin'
import { getSupabase } from '@/lib/data/auth'

export default async function AdminPlaylistsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1)
  const db = await getSupabase()
  const playlists = await getAdminPlaylists(db, page)

  return <PlaylistsManager playlists={playlists.items} total={playlists.total} page={page} pageSize={ADMIN_PAGE_SIZE} />
}
