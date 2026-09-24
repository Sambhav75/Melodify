import Link from 'next/link'
import { Button } from '@/components/ui/button'

export interface ArtistOption {
  id: string
  name: string
}

export interface AlbumOption {
  id: string
  title: string
  artist_id: string
}

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Bordered list container with an empty state. */
export function AdminList({ children, isEmpty, emptyText }: { children: React.ReactNode; isEmpty: boolean; emptyText: string }) {
  if (isEmpty) {
    return <p className="rounded-3xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>
  }
  return <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card/50">{children}</ul>
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
}: {
  page: number
  total: number
  pageSize: number
  basePath: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages} &middot; {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={`${basePath}?page=${page - 1}`}>Previous</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < pages ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={`${basePath}?page=${page + 1}`}>Next</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </nav>
  )
}
