'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/env'

/** null = still checking, true / false once known. Lets the statically cached landing page adapt to the visitor. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setSignedIn(false)
      return
    }
    let active = true
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session))
      })
      .catch(() => {
        if (active) setSignedIn(false)
      })
    return () => {
      active = false
    }
  }, [])

  return signedIn
}
