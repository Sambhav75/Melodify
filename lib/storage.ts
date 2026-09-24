'use client'

import { createClient } from '@/lib/supabase/client'
import { slugify, storagePathFromUrl } from '@/lib/utils'
import type { Result } from '@/types'

export type Bucket = 'audio' | 'covers' | 'avatars' | 'playlist-covers'

const AUDIO_TYPES = /^audio\//
const IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: File, kind: 'audio' | 'image', maxMegabytes: number): string | null {
  if (kind === 'audio' && !AUDIO_TYPES.test(file.type)) return 'Please choose an audio file (MP3, WAV, OGG, FLAC, M4A).'
  if (kind === 'image' && !IMAGE_TYPES.test(file.type)) return 'Please choose a JPG, PNG, WebP or GIF image.'
  if (file.size > maxMegabytes * 1024 * 1024) return `That file is larger than ${maxMegabytes} MB.`
  return null
}

/** Upload to Supabase Storage and resolve with the public URL. Folder = optional sub-path. */
export async function uploadFile(
  bucket: Bucket,
  file: File,
  folder = '',
): Promise<Result<{ url: string; path: string }>> {
  try {
    const supabase = createClient()
    const dot = file.name.lastIndexOf('.')
    const ext = dot > -1 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
    const base = slugify(dot > -1 ? file.name.slice(0, dot) : file.name)
    const path = `${folder ? `${folder}/` : ''}${Date.now()}-${base}${ext ? `.${ext}` : ''}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || undefined,
      upsert: false,
    })
    if (error) return { ok: false, error: error.message }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { ok: true, data: { url: data.publicUrl, path } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

/** Best-effort cleanup of an old file; failures are ignored. */
export async function removeFileByUrl(bucket: Bucket, url: string | null | undefined): Promise<void> {
  const path = storagePathFromUrl(url, bucket)
  if (!path) return
  try {
    await createClient().storage.from(bucket).remove([path])
  } catch {
    // ignore
  }
}

/** Read the length of a local audio file in whole seconds (0 if it cannot be read). */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    let settled = false

    const finish = (seconds: number) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(seconds) ? Math.round(seconds) : 0)
    }

    audio.preload = 'metadata'
    audio.onloadedmetadata = () => finish(audio.duration)
    audio.onerror = () => finish(0)
    window.setTimeout(() => finish(0), 8000)
    audio.src = url
  })
}
