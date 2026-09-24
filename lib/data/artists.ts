import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Album, Artist, Song } from '@/types'
import { getSupabase } from './auth'
import { ALBUM_SELECT, SONG_SELECT } from './select'
import { fail, one, rows } from './util'

export const getArtist = cache(async (id: string): Promise<Artist | null> => {
  const db = await getSupabase()
  const { data, error } = await db.from('artists').select('*').eq('id', id).maybeSingle()
  if (error) fail('Could not load artist', error)
  return one<Artist>(data)
})

export async function getArtists(db: SupabaseClient, limit = 12): Promise<Artist[]> {
  const { data, error } = await db
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load artists', error)
  return rows<Artist>(data)
}

export async function getArtistTopSongs(db: SupabaseClient, artistId: string, limit = 10): Promise<Song[]> {
  const { data, error } = await db
    .from('songs')
    .select(SONG_SELECT)
    .eq('artist_id', artistId)
    .order('play_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load top songs', error)
  return rows<Song>(data)
}

export async function getArtistAlbums(db: SupabaseClient, artistId: string): Promise<Album[]> {
  const { data, error } = await db
    .from('albums')
    .select(ALBUM_SELECT)
    .eq('artist_id', artistId)
    .order('release_date', { ascending: false, nullsFirst: false })
  if (error) fail('Could not load albums', error)
  return rows<Album>(data)
}
