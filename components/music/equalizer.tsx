import { cn } from '@/lib/utils'

/** Three animated bars shown next to the song that is currently playing. */
export function Equalizer({ playing = true, className }: { playing?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex h-4 items-end gap-[3px]', className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-primary"
          style={{
            animationDuration: `${720 + i * 170}ms`,
            animationDelay: `${i * 110}ms`,
            animationPlayState: playing ? 'running' : 'paused',
          }}
        />
      ))}
    </span>
  )
}
