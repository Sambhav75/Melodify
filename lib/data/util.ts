import 'server-only'

/** Normalise a Supabase result payload into an array. */
export function rows<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[]
}

export function one<T>(data: unknown): T | null {
  return (data ?? null) as T | null
}

export function fail(label: string, error: { message: string }): never {
  throw new Error(`${label}: ${error.message}`)
}

/** Run a non-critical loader; log and return null instead of breaking the whole page. */
export async function safe<T>(promise: Promise<T>, label: string): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    console.error(`[melodify] ${label} failed:`, error)
    return null
  }
}
