import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { SetupNotice } from '@/components/setup-notice'
import { ensureProfile, getProfile, getSupabase, getUser } from '@/lib/data/auth'
import { getLibrarySnapshot } from '@/lib/data/library'
import { safe } from '@/lib/data/util'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import type { LibrarySnapshot } from '@/types'

const EMPTY_LIBRARY: LibrarySnapshot = {
  likedSongIds: [],
  followedArtistIds: [],
  savedAlbumIds: [],
  likedPlaylistIds: [],
  playlists: [],
}

/**
 * Everything inside (app) requires a signed-in user (the middleware redirects guests, this is the second lock).
 * The shell - sidebar, player dock, dialogs - is mounted once here and survives client-side navigation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) return <SetupNotice />

  const user = await getUser()
  if (!user) redirect('/login')

  const db = await getSupabase()
  const profile = (await getProfile()) ?? (await ensureProfile(user))
  // hearts / follow buttons are non-critical: never let a failure here blank the whole app
  const library = (await safe(getLibrarySnapshot(db, user.id), 'library snapshot')) ?? EMPTY_LIBRARY

  return (
    <AppShell
      profile={{
        id: profile.id,
        username: profile.username,
        email: profile.email ?? user.email ?? null,
        avatar_url: profile.avatar_url,
        role: profile.role,
      }}
      library={library}
    >
      {children}
    </AppShell>
  )
}
