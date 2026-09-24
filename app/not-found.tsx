import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="ambient flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <h1 className="font-display text-4xl font-bold">404</h1>
      <p className="max-w-sm text-muted-foreground">
        We couldn&apos;t find that page. The song, album or playlist may have been moved or deleted.
      </p>
      <Button asChild>
        <Link href="/home">Back to Melodify</Link>
      </Button>
    </main>
  )
}
