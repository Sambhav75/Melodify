'use client'

import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { useSignedIn } from '@/hooks/use-signed-in'

export function LandingNav() {
  const signedIn = useSignedIn()

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
      <Logo />
      <nav aria-label="Account" className="flex items-center gap-2">
        {signedIn ? (
          <Button asChild>
            <Link href="/home">Open Melodify</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  )
}

/** The two big buttons under the hero headline. */
export function HeroActions() {
  const signedIn = useSignedIn()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {signedIn ? (
        <Button asChild size="lg">
          <Link href="/home">Open Melodify</Link>
        </Button>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </>
      )}
    </div>
  )
}
