'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListMusic, Plus, Shield } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { useLibrary } from '@/contexts/library-context'
import { useUI } from '@/contexts/ui-context'
import { NAV_ITEMS, isActivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'

const linkClasses = (active: boolean) =>
  cn(
    'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors',
    active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
  )

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { playlists } = useLibrary()
  const { openCreatePlaylist } = useUI()

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2 md:flex lg:w-72" aria-label="Sidebar">
      <div className="rounded-3xl bg-card/70 p-4">
        <Logo href="/home" className="px-2" />
        <nav aria-label="Primary" className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item)
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={linkClasses(active)}>
                <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
                {item.label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              className={linkClasses(pathname.startsWith('/admin'))}
            >
              <Shield className={cn('h-5 w-5', pathname.startsWith('/admin') && 'text-primary')} />
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-card/70 p-3">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h2 className="text-sm font-semibold text-muted-foreground">Your playlists</h2>
          <button
            type="button"
            aria-label="Create playlist"
            title="Create playlist"
            onClick={() => openCreatePlaylist()}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="scroll-area -mr-1 min-h-0 flex-1 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Playlists you create show up here.</p>
          ) : (
            <ul>
              {playlists.map((playlist) => {
                const active = pathname === `/playlist/${playlist.id}`
                return (
                  <li key={playlist.id}>
                    <Link
                      href={`/playlist/${playlist.id}`}
                      prefetch={false}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-11 items-center gap-3 rounded-xl px-2 text-sm transition-colors',
                        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                        <ListMusic className="h-4 w-4" />
                      </span>
                      <span className="truncate">{playlist.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
