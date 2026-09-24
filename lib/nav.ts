import { Heart, House, Library, ListMusic, Search, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
  /** Extra path prefixes that should also highlight this item. */
  also?: string[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Home', shortLabel: 'Home', icon: House },
  { href: '/search', label: 'Search', shortLabel: 'Search', icon: Search },
  { href: '/library', label: 'Your Library', shortLabel: 'Library', icon: Library },
  { href: '/liked', label: 'Liked Songs', shortLabel: 'Liked', icon: Heart },
  { href: '/playlists', label: 'Playlists', shortLabel: 'Playlists', icon: ListMusic, also: ['/playlist'] },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
]

/** Items shown in the phone bottom bar (Settings lives in the avatar menu there). */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== '/settings')

export function isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'also'>): boolean {
  const prefixes = [item.href, ...(item.also ?? [])]
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
