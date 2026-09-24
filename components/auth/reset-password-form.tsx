'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { friendlyAuthError } from '@/lib/auth-errors'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { FormAlert } from './form-alert'
import { PasswordInput } from './password-input'

/** Landing page of the password-reset e-mail. The callback route has already signed the user in. */
export function ResetPasswordForm() {
  const router = useRouter()
  const [checking, setChecking] = React.useState(true)
  const [hasSession, setHasSession] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!hasSupabaseEnv) {
      setChecking(false)
      return
    }
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)))
      .catch(() => setHasSession(false))
      .finally(() => setChecking(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password })
      if (updateError) {
        setError(friendlyAuthError(updateError.message))
        setLoading(false)
        return
      }
      toast.success('Password updated. You are signed in.')
      router.replace('/home')
      router.refresh()
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center py-8" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="grid gap-4">
        <FormAlert kind="error">This reset link is invalid or has expired.</FormAlert>
        <Button asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <Field label="New password" htmlFor="reset-password" hint="At least 8 characters.">
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field label="Confirm new password" htmlFor="reset-confirm">
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={loading || !password || !confirm}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Update password
      </Button>
    </form>
  )
}
