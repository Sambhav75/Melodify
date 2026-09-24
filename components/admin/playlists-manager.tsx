'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PlaylistCover } from '@/components/music/cards'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Switch } from '@/components/ui/switch'
import { friendlyError } from '@/lib/mutations'
import { removeFileByUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { formatDate, pluralize } from '@/lib/utils'
import type { Playlist } from '@/types'
import { AdminHeader, AdminList, Pagination } from './admin-ui'

/** Moderation view: every playlist, including private ones (Row Level Security lets admins see them). */
export function PlaylistsManager({
  playlists,
  total,
  page,
  pageSize,
}: {
  playlists: Playlist[]
  total: number
  page: number
  pageSize: number
}) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState<Playlist | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)

  const setVisibility = async (playlist: Playlist, isPublic: boolean) => {
    setBusyId(playlist.id)
    const { error } = await createClient().from('playlists').update({ is_public: isPublic }).eq('id', playlist.id)
    setBusyId(null)
    if (error) {
      toast.error(friendlyError(error))
      return
    }
    toast.success(isPublic ? 'Playlist is now public' : 'Playlist is now private')
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    const { error } = await createClient().from('playlists').delete().eq('id', deleting.id)
    setDeleteBusy(false)
    if (error) {
      toast.error(friendlyError(error))
      return
    }
    void removeFileByUrl('playlist-covers', deleting.cover_image)
    toast.success(`Deleted "${deleting.name}"`)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <AdminHeader title="Playlists" description={`${total} playlist${total === 1 ? '' : 's'} across all users`} />

      <AdminList isEmpty={playlists.length === 0} emptyText="No playlists have been created yet.">
        {playlists.map((playlist) => (
          <li key={playlist.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="h-12 w-12 shrink-0">
              <PlaylistCover playlist={playlist} sizes="48px" className="rounded-lg" />
            </div>
            <div className="min-w-0 flex-1 basis-40">
              <Link href={`/playlist/${playlist.id}`} className="block truncate font-medium hover:underline">
                {playlist.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                by {playlist.owner?.username ?? 'unknown'} &middot; {pluralize(playlist.song_count ?? 0, 'song')} &middot;{' '}
                {formatDate(playlist.created_at)}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={playlist.is_public}
                disabled={busyId === playlist.id}
                onCheckedChange={(checked) => void setVisibility(playlist, checked)}
                label={`Make ${playlist.name} public`}
              />
              {playlist.is_public ? 'Public' : 'Private'}
            </label>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${playlist.name}`} onClick={() => setDeleting(playlist)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </AdminList>

      <Pagination page={page} total={total} pageSize={pageSize} basePath="/admin/playlists" />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name ?? 'playlist'}"?`}
        description="The playlist is deleted for its owner too. The songs themselves are not affected."
        loading={deleteBusy}
        onConfirm={handleDelete}
      />
    </div>
  )
}
