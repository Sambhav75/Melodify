'use client'

import * as React from 'react'
import { ErrorState } from '@/components/ui/error-state'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        onRetry={reset}
      />
    </main>
  )
}
