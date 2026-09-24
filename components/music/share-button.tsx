'use client'

import { Share2 } from 'lucide-react'
import { shareLink } from '@/lib/share'
import { cn } from '@/lib/utils'

export function ShareButton({ path, title, className }: { path: string; title?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Share"
      title="Share"
      onClick={() => void shareLink(path, title)}
      className={cn(
        'grid h-12 w-12 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Share2 className="h-5 w-5" />
    </button>
  )
}
