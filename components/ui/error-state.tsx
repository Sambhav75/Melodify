'use client'

import { useRouter } from 'next/navigation'
import { TriangleAlert, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Inline "this section failed" card with a retry button. */
export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  const router = useRouter()
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="secondary" size="sm" onClick={onRetry ?? (() => router.refresh())}>
        <RotateCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
