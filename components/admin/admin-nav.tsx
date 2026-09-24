'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/songs', label: 'Songs' },
  { href: '/admin/artists', label: 'Artists' },
  { href: '/admin/albums', label: 'Albums' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/playlists', label: 'Playlists' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      {ITEMS.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
              active ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-accent',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
