import type { CSSProperties, ReactNode } from 'react'
import { hueFor } from '@/lib/utils'

/**
 * Hero block for album / artist / song / playlist pages: big artwork, title, meta and actions.
 * The colour wash behind it is derived from `seed`, so every item gets its own tint.
 */
export function EntityHeader({
  cover,
  kind,
  title,
  subtitle,
  meta,
  seed,
  children,
}: {
  cover: ReactNode
  kind: string
  title: string
  subtitle?: ReactNode
  meta?: ReactNode
  seed: string
  children?: ReactNode
}) {
  return (
    <header className="ambient px-4 pb-4 pt-8 md:px-8 md:pt-12" style={{ '--ambient-hue': hueFor(seed) } as CSSProperties}>
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
        <div className="w-44 shrink-0 sm:w-52 lg:w-60">{cover}</div>
        <div className="min-w-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{kind}</p>
          <h1 className="line-clamp-3 break-words font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-5xl">{title}</h1>
          {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
        </div>
      </div>
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">{children}</div>}
    </header>
  )
}
