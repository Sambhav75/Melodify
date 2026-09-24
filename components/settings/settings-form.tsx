'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/password-input'
import { usePlayer } from '@/contexts/audio-context'
import { friendlyAuthError } from '@/lib/auth-errors'
import { friendlyError } from '@/lib/mutations'
import { removeFileByUrl, uploadFile, validateFile } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card/70 p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const { stop } = usePlayer()
  const fileRef = React.useRef<HTMLInputElement>(null)

  const [username, setUsername] = React.useState(profile.username)
  const [usernameError, setUsernameError] = React.useState<string | null>(null)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)

  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [savingPassword, setSavingPassword] = React.useState(false)

  const saveUsername = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUsernameError(null)
    if (!USERNAME_RE.test(username)) {
      setUsernameError('Use 3-30 letters, numbers or underscores.')
      return
    }
    if (username === profile.username) return

    setSavingProfile(true)
    const { error } = await createClient().from('profiles').update({ username }).eq('id', profile.id)
    setSavingProfile(false)

    if (error) {
      setUsernameError(error.code === '23505' ? 'That username is already taken.' : friendlyError(error))
      return
    }
    toast.success('Username updated')
    router.refresh()
  }

  const uploadAvatar = async (file: File | null) => {
    if (!file) return
    const problem = validateFile(file, 'image', 2)
    if (problem) {
      toast.error(problem)
      return
    }
    setUploading(true)
    const uploaded = await uploadFile('avatars', file, profile.id)
    if (!uploaded.ok) {
      setUploading(false)
      toast.error(`Upload failed: ${uploaded.error}`)
      return
    }
    const { error } = await createClient().from('profiles').update({ avatar_url: uploaded.data.url }).eq('id', profile.id)
    setUploading(false)
    if (error) {
      toast.error(friendlyError(error))
      void removeFileByUrl('avatars', uploaded.data.url)
      return
    }
    void removeFileByUrl('avatars', profile.avatar_url)
    toast.success('Profile picture updated')
    router.refresh()
  }

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    if (password.length < 8) {
      setPasswordError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setPasswordError('The two passwords do not match.')
      return
    }
    setSavingPassword(true)
    const { error } = await createClient().auth.updateUser({ password })
    setSavingPassword(false)
    if (error) {
      setPasswordError(friendlyAuthError(error.message))
      return
    }
    setPassword('')
    setConfirm('')
    toast.success('Password changed')
  }

  const signOut = async () => {
    stop()
    const { error } = await createClient().auth.signOut({ scope: 'local' })
    if (error) {
      toast.error(friendlyAuthError(error.message))
      return
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="grid max-w-2xl gap-6">
      <Card title="Profile" description="How you appear in Melodify.">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={profile.avatar_url} name={profile.username} className="h-20 w-20 text-xl" />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/60">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            )}
          </div>
          <div className="grid gap-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                void uploadAvatar(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" />
              Change picture
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB.</p>
          </div>
        </div>

        <form onSubmit={saveUsername} className="mt-6 grid gap-4" noValidate>
          <Field label="Username" htmlFor="settings-username" error={usernameError}>
            <Input
              id="settings-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              autoCapitalize="none"
              autoComplete="username"
            />
          </Field>
          <Field label="Email" htmlFor="settings-email" hint="Your sign-in address. It can't be changed here.">
            <Input id="settings-email" value={profile.email ?? ''} readOnly disabled />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(profile.created_at)}
              {profile.role === 'admin' && ' · Administrator'}
            </p>
            <Button type="submit" disabled={savingProfile || username === profile.username}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Password" description="Choose a new password for this account.">
        <form onSubmit={savePassword} className="grid gap-4" noValidate>
          <Field label="New password" htmlFor="settings-password" error={passwordError}>
            <PasswordInput
              id="settings-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="settings-confirm">
            <PasswordInput
              id="settings-confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Button type="submit" className="justify-self-start" disabled={savingPassword || !password || !confirm}>
            {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            Change password
          </Button>
        </form>
      </Card>

      <Card title="Session">
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </Card>
    </div>
  )
}
