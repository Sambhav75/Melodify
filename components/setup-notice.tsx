import { Logo } from '@/components/brand/logo'

/** Shown instead of the app when the Supabase environment variables are missing. */
export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-6 py-16">
      <Logo />
      <h1 className="font-display text-2xl font-bold leading-tight">Connect Supabase to start listening</h1>
      <p className="text-muted-foreground">
        Melodify can&apos;t find its Supabase credentials yet. Add them and restart the dev server:
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>
          Copy <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">.env.example</code> to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">.env.local</code>.
        </li>
        <li>
          Fill in <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from
          Supabase &rarr; Project Settings &rarr; API.
        </li>
        <li>
          Run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">supabase/schema.sql</code> and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">supabase/seed.sql</code> in the Supabase SQL
          editor.
        </li>
        <li>On Vercel, add the same variables under Project Settings &rarr; Environment Variables and redeploy.</li>
      </ol>
      <p className="text-sm text-muted-foreground">The README has the full step-by-step guide.</p>
    </main>
  )
}
