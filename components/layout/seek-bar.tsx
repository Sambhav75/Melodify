'use client'

import * as React from 'react'
import { usePlayer, usePlayerTime } from '@/contexts/audio-context'
import { cn, formatDuration } from '@/lib/utils'

/** Progress slider with elapsed / total time. Dragging previews the position and seeks on release. */
export function SeekBar({ className }: { className?: string }) {
  const { current, seek } = usePlayer()
  const { currentTime, duration } = usePlayerTime()
  const [dragValue, setDragValue] = React.useState<number | null>(null)

  const max = duration > 0 ? duration : (current?.duration ?? 0)
  const value = dragValue ?? Math.min(currentTime, max > 0 ? max : currentTime)
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0

  // Commit on release, even if the pointer ends up outside the slider.
  React.useEffect(() => {
    if (dragValue === null) return
    const release = () => {
      seek(dragValue)
      setDragValue(null)
    }
    window.addEventListener('pointerup', release, { once: true })
    window.addEventListener('touchend', release, { once: true })
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('touchend', release)
    }
  }, [dragValue, seek])

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{formatDuration(value)}</span>
      <input
        type="range"
        aria-label="Seek"
        aria-valuetext={`${formatDuration(value)} of ${formatDuration(max)}`}
        min={0}
        max={max > 0 ? max : 1}
        step={0.1}
        value={value}
        disabled={!current}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onKeyUp={() => {
          if (dragValue !== null) {
            seek(dragValue)
            setDragValue(null)
          }
        }}
        style={{ '--value': `${percent}%` } as React.CSSProperties}
        className="melodify-range disabled:cursor-default disabled:opacity-40"
      />
      <span className="w-10 text-xs tabular-nums text-muted-foreground">{formatDuration(max)}</span>
    </div>
  )
}

/** Thin progress line used by the phone mini-player. */
export function MiniProgress() {
  const { current } = usePlayer()
  const { currentTime, duration } = usePlayerTime()
  const max = duration > 0 ? duration : (current?.duration ?? 0)
  const percent = max > 0 ? Math.min(100, (currentTime / max) * 100) : 0

  return (
    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10" aria-hidden="true">
      <div className="h-full bg-brand-gradient" style={{ width: `${percent}%` }} />
    </div>
  )
}
