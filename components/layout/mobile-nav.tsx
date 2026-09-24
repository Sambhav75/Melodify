'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MOBILE_NAV_ITEMS, isActivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'

/** On phones the sidebar becomes a bottom navigation bar with large touch targets. */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="glass safe-bottom shrink-0 border-t border-border/60 md:hidden">
      <ul className="grid grid-cols-5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <item.icon className={cn('h-6 w-6', active && 'text-primary')} />
                {item.shortLabel}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
