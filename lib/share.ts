'use client'

import { toast } from 'sonner'

/** Use the native share sheet when available, otherwise copy the link. */
export async function shareLink(path: string, title?: string): Promise<void> {
  const url = new URL(path, window.location.origin).toString()

  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url })
      return
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return // user closed the sheet
  }

  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  } catch {
    toast.error('Could not copy the link')
  }
}
