/** Turn raw Supabase Auth messages into friendly, actionable text. */
export function friendlyAuthError(message: string | null | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email address first. Check your inbox for the confirmation link.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (m.includes('password should be at least') || m.includes('weak password')) {
    return 'Choose a stronger password (at least 8 characters).'
  }
  if (m.includes('should be different from the old password') || m.includes('same password')) {
    return 'Your new password must be different from the old one.'
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return 'Network error. Check your connection and try again.'
  }
  if (m.includes('auth session missing') || m.includes('invalid or has expired') || m.includes('expired')) {
    return 'This link has expired. Please request a new one.'
  }
  return message?.trim() || 'Something went wrong. Please try again.'
}

/** Only allow same-site relative redirects (prevents open-redirect attacks). */
export function safeRedirectPath(input: string | null | undefined, fallback = '/home'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//') || input.startsWith('/\\')) return fallback
  if (/^\/(login|signup|forgot-password)(\/|\?|$)/.test(input)) return fallback
  return input
}
