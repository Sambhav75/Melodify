import { ArtistsManager } from '@/components/admin/artists-manager'
import { ADMIN_PAGE_SIZE, getAdminArtists } from '@/lib/data/admin'
import { getSupabase } from '@/lib/data/auth'

export default async function AdminArtistsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1)
  const db = await getSupabase()
  const artists = await getAdminArtists(db, page)

  return <ArtistsManager artists={artists.items} total={artists.total} page={page} pageSize={ADMIN_PAGE_SIZE} />
}
