import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { safeRedirectPath } from '@/lib/auth-errors'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const notice = params.error ? 'That sign-in link is invalid or has expired. Please try again.' : null

  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to pick up where you left off.</p>
      </div>
      <LoginForm next={safeRedirectPath(params.next)} notice={notice} />
      <p className="text-center text-sm text-muted-foreground">
        New to Melodify?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
