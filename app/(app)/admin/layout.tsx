import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdmin } from '@/lib/data/auth'

export const metadata: Metadata = { title: 'Admin' }

/** Only administrators get past this layout (Row Level Security enforces the same rule in the database). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="px-4 pb-6 pt-6 md:px-8">
      <h1 className="mb-5 font-display text-2xl font-bold md:text-3xl">Admin dashboard</h1>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
