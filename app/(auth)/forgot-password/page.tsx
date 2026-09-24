import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
