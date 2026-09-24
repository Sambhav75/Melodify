import * as React from 'react'
import { cn } from '@/lib/utils'

/** Label + control + optional hint / error message. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string | null
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
