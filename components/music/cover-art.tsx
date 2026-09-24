'use client'

import * as React from 'react'
import Image from 'next/image'
import { ListMusic, Music, User } from 'lucide-react'
import { cn, gradientFor } from '@/lib/utils'

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
  } catch {
    return null
  }
})()

/** next/image only accepts hosts listed in next.config.mjs; anything else falls back to a plain <img>. */
function canUseNextImage(src: string): boolean {
  if (src.startsWith('/')) return true
  try {
    const { hostname } = new URL(src)
    return hostname.endsWith('.supabase.co') || (SUPABASE_HOST !== null && hostname === SUPABASE_HOST)
  } catch {
    return false
  }
}

export function CoverArt({
  src,
  alt,
  seed,
  className,
  sizes = '200px',
  priority = false,
  variant = 'music',
  rounded = 'rounded-xl',
}: {
  src?: string | null
  alt: string
  /** Any stable string; drives the fallback gradient when there is no image. */
  seed: string
  className?: string
  sizes?: string
  priority?: boolean
  variant?: 'music' | 'artist' | 'playlist'
  rounded?: string
}) {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [src])

  const showImage = Boolean(src) && !failed
  const Icon = variant === 'artist' ? User : variant === 'playlist' ? ListMusic : Music

  return (
    <div
      className={cn('relative aspect-square w-full overflow-hidden bg-muted', rounded, className)}
      style={showImage ? undefined : { backgroundImage: gradientFor(seed) }}
    >
      {showImage && src ? (
        canUseNextImage(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/70">
          <Icon className="h-1/3 w-1/3" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
