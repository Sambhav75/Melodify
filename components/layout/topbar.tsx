'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { UserMenu, type ProfileLite } from './user-menu'

/** Desktop shortcut into search. Hidden on the search page, which has its own big box. */
function TopSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const [term, setTerm] = React.useState('')

  if (pathname.startsWith('/search')) return <div className="hidden flex-1 md:block" />

  return (
    <form
      role="search"
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(e) => {
        e.preventDefault()
        const q = term.trim()
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        type="search"
        placeholder="Search songs, artists, albums"
        aria-label="Search"
        className="h-11 w-full rounded-full border border-transparent bg-secondary/70 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
      />
    </form>
  )
}

export function Topbar({ profile }: { profile: ProfileLite }) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-6">
      <Logo href="/home" className="md:hidden" />
      <TopSearch />
      <UserMenu profile={profile} />
    </div>
  )
}
