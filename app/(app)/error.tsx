'use client'

import * as React from 'react'
import { ErrorState } from '@/components/ui/error-state'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="px-4 py-16 md:px-8">
      <ErrorState
        title="This page hit a problem"
        description="Something went wrong while loading it. Your music keeps playing. Try again in a moment."
        onRetry={reset}
      />
    </div>
  )
}
