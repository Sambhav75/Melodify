'use client'

import * as React from 'react'
import { cn, getInitials, gradientFor } from '@/lib/utils'

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [src])

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn('h-9 w-9 shrink-0 rounded-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white', className)}
      style={{ backgroundImage: gradientFor(name) }}
    >
      {getInitials(name)}
    </span>
  )
}
