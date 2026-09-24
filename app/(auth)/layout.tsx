import { Logo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
        {children}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Melodify &middot; listen to your music anywhere</p>
    </div>
  )
}
