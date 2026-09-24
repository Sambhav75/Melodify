import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton shown while any page in the app loads. */
export default function Loading() {
  return (
    <div className="space-y-8 px-4 py-6 md:px-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-64 max-w-full" />
      {[0, 1].map((row) => (
        <div key={row}>
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[9.5rem] shrink-0 sm:w-44 md:w-48">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
