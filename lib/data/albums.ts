import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Album, Song } from '@/types'
import { getSupabase } from './auth'
import { ALBUM_SELECT, SONG_SELECT } from './select'
import { fail, one, rows } from './util'

export const getAlbum = cache(async (id: string): Promise<Album | null> => {
  const db = await getSupabase()
  const { data, error } = await db.from('albums').select(ALBUM_SELECT).eq('id', id).maybeSingle()
  if (error) fail('Could not load album', error)
  return one<Album>(data)
})

export async function getAlbumTracks(db: SupabaseClient, albumId: string): Promise<Song[]> {
  const { data, error } = await db
    .from('songs')
    .select(SONG_SELECT)
    .eq('album_id', albumId)
    .order('track_number', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) fail('Could not load tracks', error)
  return rows<Song>(data)
}

export async function getRecentAlbums(db: SupabaseClient, limit = 12): Promise<Album[]> {
  const { data, error } = await db
    .from('albums')
    .select(ALBUM_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load albums', error)
  return rows<Album>(data)
}
