'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlayer } from '@/contexts/audio-context'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export type ProfileLite = Pick<Profile, 'id' | 'username' | 'email' | 'avatar_url' | 'role'>

export function UserMenu({ profile }: { profile: ProfileLite }) {
  const router = useRouter()
  const { stop } = usePlayer()

  const handleSignOut = async () => {
    stop()
    try {
      const { error } = await createClient().auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log out. Please try again.')
      return
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:ring-2 data-[state=open]:ring-primary/60"
        >
          <Avatar src={profile.avatar_url} name={profile.username} className="h-10 w-10" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold text-foreground">{profile.username}</span>
          {profile.email && <span className="block truncate">{profile.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          <User /> Profile &amp; settings
        </DropdownMenuItem>
        {profile.role === 'admin' && (
          <DropdownMenuItem onSelect={() => router.push('/admin')}>
            <Shield /> Admin dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
