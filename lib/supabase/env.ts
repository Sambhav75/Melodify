export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** True when both public Supabase variables are present. */
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)
