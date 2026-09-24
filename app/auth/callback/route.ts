import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirectPath } from '@/lib/auth-errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase e-mail links (confirm sign-up, reset password, magic link) land here with a ?code=.
 * We exchange it for a session cookie and continue to ?next=.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'), '/home')

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) return NextResponse.redirect(`${origin}${next}`)
    } catch {
      // fall through to the error redirect
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
