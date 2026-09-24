'use client'

import * as React from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { friendlyAuthError } from '@/lib/auth-errors'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { FormAlert } from './form-alert'

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!hasSupabaseEnv) {
      setError('Supabase is not configured yet. Add your keys to .env.local and restart the server.')
      return
    }

    setLoading(true)
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (resetError) {
        setError(friendlyAuthError(resetError.message))
        setLoading(false)
        return
      }
      setSent(true)
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ''))
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="grid gap-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 className="font-display text-xl font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on its
          way. Open it on this device.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <Field label="Email" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={loading || !email}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}
