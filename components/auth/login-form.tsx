'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { friendlyAuthError } from '@/lib/auth-errors'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { FormAlert } from './form-alert'
import { PasswordInput } from './password-input'

export function LoginForm({ next, notice }: { next: string; notice?: string | null }) {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!hasSupabaseEnv) {
      setError('Supabase is not configured yet. Add your keys to .env.local and restart the server.')
      return
    }

    setLoading(true)
    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
      if (signInError) {
        setError(friendlyAuthError(signInError.message))
        setLoading(false)
        return
      }
      toast.success('Welcome back!')
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ''))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {notice && <FormAlert kind="error">{notice}</FormAlert>}
      {error && <FormAlert kind="error">{error}</FormAlert>}

      <Field label="Email" htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field label="Password" htmlFor="login-password">
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
      </Field>

      <Button type="submit" size="lg" disabled={loading || !email || !password}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  )
}
