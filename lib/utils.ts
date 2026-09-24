import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Song } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ------------------------------ time & dates ------------------------------ */

/** 245 -> "4:05", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00'
  }
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** 3900 -> "1 hr 5 min" */
export function formatTotalDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h} hr ${m} min` : `${h} hr`
  if (m > 0) return `${m} min`
  return s > 0 ? `${s} sec` : '0 min'
}

/** Dates are rendered in UTC so server and browser always agree. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function formatYear(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : String(d.getUTCFullYear())
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diffMs)) return ''
  const sec = Math.max(1, Math.round(diffMs / 1000))
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}

/* --------------------------------- strings -------------------------------- */

export function hashString(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function hueFor(seed: string): number {
  return hashString(seed) % 360
}

/** Deterministic fallback artwork when an item has no image. */
export function gradientFor(seed: string): string {
  const h = hueFor(seed)
  return `linear-gradient(135deg, hsl(${h} 70% 48%), hsl(${(h + 48) % 360} 75% 30%))`
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Escape % and _ so user input cannot act as an ILIKE wildcard. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`)
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // drop accents: é -> e
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-*\.-*/g, '.')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 60) || 'file'
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value)
}

/* ---------------------------------- arrays -------------------------------- */

export function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const k = key(item)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(item)
    }
  }
  return out
}

/* ---------------------------------- music --------------------------------- */

export function songCover(song: Pick<Song, 'cover_url' | 'album'>): string | null {
  return song.cover_url ?? song.album?.cover_url ?? null
}

export function sumDuration(songs: readonly Pick<Song, 'duration'>[]): number {
  return songs.reduce((total, s) => total + (s.duration || 0), 0)
}

/** Strip the public-URL prefix from a Supabase Storage URL to get the object path. */
export function storagePathFromUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0])
}
