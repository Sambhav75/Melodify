'use client'

import * as React from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/contexts/audio-context'
import { cn } from '@/lib/utils'

export function VolumeControl({ className }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer()
  const level = muted ? 0 : volume
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        aria-pressed={muted}
        onClick={toggleMute}
        className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="h-5 w-5" />
      </button>
      <input
        type="range"
        aria-label="Volume"
        min={0}
        max={1}
        step={0.01}
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ '--value': `${level * 100}%` } as React.CSSProperties}
        className="melodify-range w-24"
      />
    </div>
  )
}
