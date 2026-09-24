import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

/** One Supabase client per request. */
export const getSupabase = cache(async (): Promise<SupabaseClient> => createClient())

/** The signed-in auth user (validated with Supabase Auth), or null. */
export const getUser = cache(async () => {
  const supabase = await getSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await getSupabase()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (data ?? null) as unknown as Profile | null
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<Profile> {
  await requireUser()
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/home')
  return profile
}

/** Safety net for accounts created before schema.sql ran (the sign-up trigger normally creates the profile). */
export async function ensureProfile(user: User): Promise<Profile> {
  const db = await getSupabase()
  const username = `user_${user.id.replace(/-/g, '').slice(0, 8)}`
  const { data } = await db
    .from('profiles')
    .insert({ id: user.id, username, email: user.email ?? null })
    .select('*')
    .maybeSingle()

  return (
    (data as unknown as Profile | null) ?? {
      id: user.id,
      username,
      email: user.email ?? null,
      avatar_url: null,
      role: 'user',
      created_at: new Date().toISOString(),
    }
  )
}
