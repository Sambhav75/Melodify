import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pages that require a signed-in user. */
const PROTECTED_PREFIXES = [
  '/home',
  '/search',
  '/library',
  '/liked',
  '/playlists',
  '/playlist',
  '/song',
  '/artist',
  '/album',
  '/settings',
  '/admin',
]

/** Pages a signed-in user has no reason to see again. */
const AUTH_PAGES = ['/login', '/signup', '/forgot-password']

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Not configured yet: let the pages render their own "set up Supabase" notice.
  if (!url || !key) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser() validates the token with Supabase Auth (getSession() alone can be spoofed).
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))

  const redirectTo = (pathname: string, next?: string) => {
    const target = request.nextUrl.clone()
    target.pathname = pathname
    target.search = ''
    if (next) target.searchParams.set('next', next)
    const redirect = NextResponse.redirect(target)
    // keep any refreshed auth cookies
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (!user && isProtected) {
    return redirectTo('/login', `${path}${request.nextUrl.search}`)
  }

  if (user && AUTH_PAGES.includes(path)) {
    return redirectTo('/home')
  }

  return response
}
