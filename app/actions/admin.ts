'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Result } from '@/types'

/**
 * Deleting an auth user needs the service-role key, which must NEVER reach the browser.
 * This server action verifies the caller is an admin first, then uses the key on the server only.
 */
export async function deleteUserAction(userId: string): Promise<Result> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server, so users cannot be deleted from here.' }
  }

  // 1) who is asking?
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'You need to be signed in.' }

  const { data: me } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if ((me as { role?: string } | null)?.role !== 'admin') return { ok: false, error: 'Administrators only.' }
  if (userId === auth.user.id) return { ok: false, error: "You can't delete your own account from the admin area." }

  // 2) privileged delete (cascades to profile, playlists, likes, history)
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { ok: true, data: null }
}
