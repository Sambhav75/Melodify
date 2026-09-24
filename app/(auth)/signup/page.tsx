import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = { title: 'Create your account' }

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Free forever. No credit card, no ads.</p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
