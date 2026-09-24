import type { CSSProperties } from 'react'
import { CoverArt } from '@/components/music/cover-art'

/** Ripples radiating from a stack of drifting covers: the "sound waves from a record" idea. */
export function HeroArt({ covers }: { covers: { src: string | null; seed: string }[] }) {
  const cards = [
    { pos: 'left-[2%] top-[8%] w-[42%]', tilt: '-9deg', delay: '0s' },
    { pos: 'left-[30%] top-[26%] z-10 w-[50%]', tilt: '3deg', delay: '-2s' },
    { pos: 'right-[0%] top-[4%] w-[36%]', tilt: '10deg', delay: '-4s' },
  ]

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full border border-primary/30"
          style={{ width: `${34 + i * 16}%`, animationDelay: `${i * 0.55}s` }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gradient opacity-25 blur-3xl" />

      {cards.map((card, i) => (
        <div
          key={i}
          className={`absolute animate-drift ${card.pos}`}
          style={{ '--tilt': card.tilt, animationDelay: card.delay } as CSSProperties}
        >
          <CoverArt
            src={covers[i]?.src}
            alt=""
            seed={covers[i]?.seed ?? `hero-${i}`}
            sizes="220px"
            priority
            rounded="rounded-2xl"
            className="shadow-2xl shadow-black/60 ring-1 ring-white/10"
          />
        </div>
      ))}
    </div>
  )
}

/** Decorative equalizer skyline. */
export function WaveStrip() {
  return (
    <div className="flex h-14 items-end justify-center gap-[5px] overflow-hidden opacity-50" aria-hidden="true">
      {Array.from({ length: 64 }).map((_, i) => (
        <span
          key={i}
          className="w-1 origin-bottom animate-eq rounded-full bg-brand-gradient"
          style={{
            height: `${28 + ((i * 37) % 72)}%`,
            animationDelay: `${(i * 97) % 1500}ms`,
            animationDuration: `${1100 + ((i * 53) % 900)}ms`,
          }}
        />
      ))}
    </div>
  )
}
