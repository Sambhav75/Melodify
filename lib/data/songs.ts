import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Song } from '@/types'
import { uniqueBy } from '@/lib/utils'
import { getSupabase } from './auth'
import { SONG_SELECT } from './select'
import { fail, one, rows } from './util'

export async function getRecentSongs(db: SupabaseClient, limit = 12): Promise<Song[]> {
  const { data, error } = await db
    .from('songs')
    .select(SONG_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load recent songs', error)
  return rows<Song>(data)
}

export async function getPopularSongs(db: SupabaseClient, limit = 10): Promise<Song[]> {
  const { data, error } = await db
    .from('songs')
    .select(SONG_SELECT)
    .order('play_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load popular songs', error)
  return rows<Song>(data)
}

/** Cached per request so generateMetadata() and the page share one query. */
export const getSong = cache(async (id: string): Promise<Song | null> => {
  const db = await getSupabase()
  const { data, error } = await db.from('songs').select(SONG_SELECT).eq('id', id).maybeSingle()
  if (error) fail('Could not load song', error)
  return one<Song>(data)
})

/** Same artist first, then same genre, topped up with popular songs. */
export async function getRelatedSongs(db: SupabaseClient, song: Song, limit = 10): Promise<Song[]> {
  const sameArtistQuery = db
    .from('songs')
    .select(SONG_SELECT)
    .eq('artist_id', song.artist_id)
    .neq('id', song.id)
    .order('play_count', { ascending: false })
    .limit(limit)

  const sameGenreQuery = song.genre
    ? db
        .from('songs')
        .select(SONG_SELECT)
        .eq('genre', song.genre)
        .neq('id', song.id)
        .order('play_count', { ascending: false })
        .limit(limit)
    : null

  const [sameArtist, sameGenre] = await Promise.all([sameArtistQuery, sameGenreQuery])
  if (sameArtist.error) fail('Could not load related songs', sameArtist.error)

  let related = uniqueBy([...rows<Song>(sameArtist.data), ...rows<Song>(sameGenre?.data)], (s) => s.id)

  if (related.length < limit) {
    const { data } = await db
      .from('songs')
      .select(SONG_SELECT)
      .neq('id', song.id)
      .order('play_count', { ascending: false })
      .limit(limit + related.length + 1)
    related = uniqueBy([...related, ...rows<Song>(data)], (s) => s.id)
  }

  return related.filter((s) => s.id !== song.id).slice(0, limit)
}

/** Distinct genres ordered by how many songs they contain. */
export async function getGenres(db: SupabaseClient, limit = 12): Promise<string[]> {
  const { data, error } = await db.from('songs').select('genre').not('genre', 'is', null).limit(1000)
  if (error) fail('Could not load genres', error)
  const counts = new Map<string, number>()
  for (const row of rows<{ genre: string | null }>(data)) {
    if (row.genre) counts.set(row.genre, (counts.get(row.genre) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre)
}
