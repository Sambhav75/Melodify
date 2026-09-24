'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteUserAction } from '@/app/actions/admin'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select } from '@/components/ui/input'
import { friendlyError } from '@/lib/mutations'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Profile, Role } from '@/types'
import { AdminHeader, AdminList, Pagination } from './admin-ui'

export function UsersManager({
  users,
  total,
  page,
  pageSize,
  currentUserId,
  canDelete,
}: {
  users: Profile[]
  total: number
  page: number
  pageSize: number
  currentUserId: string
  /** True when SUPABASE_SERVICE_ROLE_KEY is configured on the server. */
  canDelete: boolean
}) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<Profile | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)

  const changeRole = async (user: Profile, role: Role) => {
    if (role === user.role) return
    setBusyId(user.id)
    const { error } = await createClient().from('profiles').update({ role }).eq('id', user.id)
    setBusyId(null)
    if (error) {
      toast.error(friendlyError(error))
      router.refresh() // put the select back to the real value
      return
    }
    toast.success(`${user.username} is now ${role === 'admin' ? 'an administrator' : 'a regular user'}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    const result = await deleteUserAction(deleting.id)
    setDeleteBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(`Deleted ${deleting.username}`)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <AdminHeader
        title="Users"
        description={`${total} registered user${total === 1 ? '' : 's'}${
          canDelete ? '' : ' · set SUPABASE_SERVICE_ROLE_KEY on the server to enable deleting users'
        }`}
      />

      <AdminList isEmpty={users.length === 0} emptyText="No users yet.">
        {users.map((user) => {
          const isSelf = user.id === currentUserId
          return (
            <li key={user.id} className="flex flex-wrap items-center gap-3 p-3">
              <Avatar src={user.avatar_url} name={user.username} className="h-11 w-11" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-medium">
                  {user.username}
                  {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email ?? 'No email'} &middot; joined {formatDate(user.created_at)}
                </p>
              </div>
              <Select
                aria-label={`Role for ${user.username}`}
                className="h-10 w-36"
                value={user.role}
                disabled={isSelf || busyId === user.id}
                onChange={(e) => void changeRole(user, e.target.value as Role)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${user.username}`}
                  disabled={isSelf}
                  onClick={() => setDeleting(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          )
        })}
      </AdminList>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/admin/users" />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.username ?? 'user'}?`}
        description="Their account, playlists, likes and listening history are permanently deleted."
        loading={deleteBusy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
