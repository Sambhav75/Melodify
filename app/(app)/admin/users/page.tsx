import { UsersManager } from '@/components/admin/users-manager'
import { ADMIN_PAGE_SIZE, getAdminUsers } from '@/lib/data/admin'
import { getSupabase, requireUser } from '@/lib/data/auth'

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(rawPage)) || 1)
  const me = await requireUser()
  const db = await getSupabase()
  const users = await getAdminUsers(db, page)

  return (
    <UsersManager
      users={users.items}
      total={users.total}
      page={page}
      pageSize={ADMIN_PAGE_SIZE}
      currentUserId={me.id}
      canDelete={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
    />
  )
}
