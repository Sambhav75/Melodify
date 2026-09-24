import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Melodify mark: a rounded tile with an "M" drawn as a single sound-wave line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id="melodify-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#976bff" />
          <stop offset="0.58" stopColor="#f859be" />
          <stop offset="1" stopColor="#ffb23d" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#melodify-mark)" />
      <path
        d="M8.5 22V11.5l7.5 8 7.5-8V22"
        fill="none"
        stroke="#120c22"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({
  href = '/',
  className,
  showWordmark = true,
}: {
  href?: string
  className?: string
  showWordmark?: boolean
}) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Melodify home">
      <LogoMark />
      {showWordmark && <span className="font-display text-lg font-semibold tracking-tight">Melodify</span>}
    </Link>
  )
}
