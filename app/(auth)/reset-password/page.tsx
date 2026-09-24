import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = { title: 'Choose a new password' }

export default function ResetPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Pick something you haven&apos;t used before.</p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
