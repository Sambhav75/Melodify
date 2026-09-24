import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/settings-form'
import { ensureProfile, getProfile, getUser } from '@/lib/data/auth'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect('/login')
  const profile = (await getProfile()) ?? (await ensureProfile(user))

  return (
    <div className="px-4 pb-6 pt-6 md:px-8">
      <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">Settings</h1>
      <SettingsForm profile={{ ...profile, email: profile.email ?? user.email ?? null }} />
    </div>
  )
}
