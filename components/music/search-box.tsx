'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

/**
 * Type-ahead search. The query lives in the URL (?q=), results are rendered on the server,
 * so a search can be shared, bookmarked and reached with the back button.
 */
export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(initialQuery)
  const [pending, startTransition] = React.useTransition()
  const debounced = useDebounce(value, 250)
  const pushed = React.useRef<Set<string>>(new Set([initialQuery.trim()]))
  const last = React.useRef(initialQuery.trim())
  const inputRef = React.useRef<HTMLInputElement>(null)

  const navigate = React.useCallback(
    (raw: string) => {
      const q = raw.trim()
      if (q === last.current) return
      last.current = q
      pushed.current.add(q)
      startTransition(() => {
        router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search', { scroll: false })
      })
    },
    [router],
  )

  // search as the user types
  React.useEffect(() => {
    navigate(debounced)
  }, [debounced, navigate])

  // the URL changed from outside (genre tile, top search bar): follow it
  React.useEffect(() => {
    const incoming = initialQuery.trim()
    if (pushed.current.has(incoming)) return
    pushed.current.add(incoming)
    last.current = incoming
    setValue(initialQuery)
  }, [initialQuery])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        navigate(value)
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoFocus={!initialQuery}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What do you want to listen to?"
        aria-label="Search songs, artists, albums and playlists"
        className="h-14 w-full rounded-full border border-transparent bg-secondary/80 pl-12 pr-24 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />}
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
            className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  )
}
