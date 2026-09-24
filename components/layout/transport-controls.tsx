'use client'

import { Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { PlayCircle } from '@/components/music/play-button'
import { usePlayer } from '@/contexts/audio-context'
import { cn } from '@/lib/utils'

function ControlButton({
  label,
  onClick,
  disabled,
  pressed,
  large,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
  large?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative grid place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30',
        large ? 'h-12 w-12' : 'h-10 w-10',
        pressed ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      {pressed && <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
    </button>
  )
}

/** Shuffle - previous - play/pause - next - repeat. Shared by the dock and the phone now-playing sheet. */
export function TransportControls({ large = false, className }: { large?: boolean; className?: string }) {
  const { current, isPlaying, isBuffering, shuffle, repeat, hasNext, togglePlay, next, previous, toggleShuffle, cycleRepeat } =
    usePlayer()
  const icon = large ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <div className={cn('flex items-center justify-center gap-1 sm:gap-2', className)}>
      <ControlButton
        label={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
        pressed={shuffle}
        large={large}
        onClick={toggleShuffle}
      >
        <Shuffle className={icon} />
      </ControlButton>
      <ControlButton label="Previous" disabled={!current} large={large} onClick={previous}>
        <SkipBack className={cn(icon, 'fill-current')} />
      </ControlButton>
      <PlayCircle
        size={large ? 'lg' : 'md'}
        playing={isPlaying}
        loading={Boolean(current) && isBuffering}
        label={isPlaying ? 'Pause' : 'Play'}
        onClick={togglePlay}
        className={cn(!current && 'pointer-events-none opacity-40')}
      />
      <ControlButton label="Next" disabled={!hasNext} large={large} onClick={next}>
        <SkipForward className={cn(icon, 'fill-current')} />
      </ControlButton>
      <ControlButton
        label={repeat === 'off' ? 'Repeat all' : repeat === 'all' ? 'Repeat one' : 'Turn repeat off'}
        pressed={repeat !== 'off'}
        large={large}
        onClick={cycleRepeat}
      >
        {repeat === 'one' ? <Repeat1 className={icon} /> : <Repeat className={icon} />}
      </ControlButton>
    </div>
  )
}
