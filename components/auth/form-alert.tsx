import { CircleCheck, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormAlert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const Icon = kind === 'success' ? CircleCheck : CircleAlert
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        kind === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        kind === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        kind === 'info' && 'border-border bg-muted/60 text-muted-foreground',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
