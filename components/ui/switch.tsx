'use client'

import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[26px]' : 'translate-x-1',
        )}
      />
    </button>
  )
}
