import { AlbumsManager } from '@/components/admin/albums-manager'
import { ADMIN_PAGE_SIZE, getAdminAlbums, getArtistOptions } from '@/lib/data/admin'
import { getSupabase } from '@/lib/data/auth'

export default async function AdminAlbumsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1)
  const db = await getSupabase()
  const [albums, artists] = await Promise.all([getAdminAlbums(db, page), getArtistOptions(db)])

  return <AlbumsManager albums={albums.items} total={albums.total} page={page} pageSize={ADMIN_PAGE_SIZE} artists={artists} />
}
