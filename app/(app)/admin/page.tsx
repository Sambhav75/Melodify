import Link from 'next/link'
import { Disc3, ListMusic, MicVocal, Music, Users } from 'lucide-react'
import { AdminHeader } from '@/components/admin/admin-ui'
import { ErrorState } from '@/components/ui/error-state'
import { getAdminStats } from '@/lib/data/admin'
import { getSupabase } from '@/lib/data/auth'
import { safe } from '@/lib/data/util'

export default async function AdminOverviewPage() {
  const db = await getSupabase()
  const stats = await safe(getAdminStats(db), 'admin stats')

  if (!stats) return <ErrorState title="Couldn't load the dashboard" />

  const cards = [
    { label: 'Songs', value: stats.songs, href: '/admin/songs', icon: Music },
    { label: 'Artists', value: stats.artists, href: '/admin/artists', icon: MicVocal },
    { label: 'Albums', value: stats.albums, href: '/admin/albums', icon: Disc3 },
    { label: 'Users', value: stats.users, href: '/admin/users', icon: Users },
    { label: 'Playlists', value: stats.playlists, href: '/admin/playlists', icon: ListMusic },
  ]

  return (
    <div>
      <AdminHeader title="Overview" description="Manage the music library, people and playlists." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-3xl border border-border bg-card/60 p-5 transition-colors hover:bg-accent/40"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 font-display text-3xl font-bold tabular-nums">{card.value.toLocaleString('en-US')}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 max-w-2xl rounded-3xl border border-border bg-card/60 p-5">
        <h3 className="font-display text-base font-semibold">Adding music</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <Link href="/admin/artists" className="text-primary hover:underline">
              Create an artist
            </Link>{' '}
            (name, biography, photo).
          </li>
          <li>
            <Link href="/admin/albums" className="text-primary hover:underline">
              Create an album
            </Link>{' '}
            for that artist. Albums can also be EPs or singles.
          </li>
          <li>
            <Link href="/admin/songs" className="text-primary hover:underline">
              Upload songs
            </Link>{' '}
            and attach them to the artist and album. Length is detected automatically.
          </li>
        </ol>
      </div>
    </div>
  )
}
