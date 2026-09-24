import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * Cookie-free anonymous client. Use it for public catalogue data (e.g. the landing page)
 * so the page can be statically generated / cached. Returns null when Supabase isn't configured.
 */
export function createPublicClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseClient
}
