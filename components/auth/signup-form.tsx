'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { friendlyAuthError } from '@/lib/auth-errors'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { FormAlert } from './form-alert'
import { PasswordInput } from './password-input'

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/

export function SignupForm() {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ username?: string; password?: string }>({})
  const [confirmationSent, setConfirmationSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const errors: { username?: string; password?: string } = {}
    if (!USERNAME_RE.test(username)) errors.username = 'Use 3-30 letters, numbers or underscores.'
    if (password.length < 8) errors.password = 'Use at least 8 characters.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!hasSupabaseEnv) {
      setError('Supabase is not configured yet. Add your keys to .env.local and restart the server.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data: available } = await supabase.rpc('username_available', { p_username: username })
      if (available === false) {
        setFieldErrors({ username: 'That username is already taken.' })
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
        },
      })

      if (signUpError) {
        setError(friendlyAuthError(signUpError.message))
        setLoading(false)
        return
      }

      // Supabase hides "already registered" by returning a user without identities.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try logging in instead.')
        setLoading(false)
        return
      }

      if (data.session) {
        toast.success('Welcome to Melodify!')
        router.replace('/home')
        router.refresh()
        return
      }

      setConfirmationSent(true)
      setLoading(false)
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="grid gap-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 className="font-display text-xl font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it on this
          device to activate your account, then log in.
        </p>
        <Button asChild variant="secondary">
          <Link href="/login">Go to log in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {error && <FormAlert kind="error">{error}</FormAlert>}

      <Field label="Username" htmlFor="signup-username" error={fieldErrors.username} hint="This is how other people see you.">
        <Input
          id="signup-username"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="your_name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          required
        />
      </Field>

      <Field label="Email" htmlFor="signup-email">
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field label="Password" htmlFor="signup-password" error={fieldErrors.password} hint="At least 8 characters.">
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      <Button type="submit" size="lg" disabled={loading || !email || !username || !password}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  )
}
