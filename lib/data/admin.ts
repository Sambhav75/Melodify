import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Album, Artist, Playlist, Profile, Song } from '@/types'
import { attachOwners, attachPlaylistMeta } from './playlists'
import { ALBUM_SELECT, SONG_SELECT } from './select'
import { fail, rows } from './util'

export const ADMIN_PAGE_SIZE = 20

export interface Page<T> {
  items: T[]
  total: number
}

async function countRows(db: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
  if (error) fail(`Could not count ${table}`, error)
  return count ?? 0
}

export async function getAdminStats(db: SupabaseClient) {
  const [songs, artists, albums, users, playlists] = await Promise.all([
    countRows(db, 'songs'),
    countRows(db, 'artists'),
    countRows(db, 'albums'),
    countRows(db, 'profiles'),
    countRows(db, 'playlists'),
  ])
  return { songs, artists, albums, users, playlists }
}

function range(page: number) {
  const from = Math.max(0, page - 1) * ADMIN_PAGE_SIZE
  return { from, to: from + ADMIN_PAGE_SIZE - 1 }
}

export async function getAdminSongs(db: SupabaseClient, page: number): Promise<Page<Song>> {
  const { from, to } = range(page)
  const { data, error, count } = await db
    .from('songs')
    .select(SONG_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) fail('Could not load songs', error)
  return { items: rows<Song>(data), total: count ?? 0 }
}

export async function getAdminArtists(db: SupabaseClient, page: number): Promise<Page<Artist>> {
  const { from, to } = range(page)
  const { data, error, count } = await db
    .from('artists')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) fail('Could not load artists', error)
  return { items: rows<Artist>(data), total: count ?? 0 }
}

export async function getAdminAlbums(db: SupabaseClient, page: number): Promise<Page<Album>> {
  const { from, to } = range(page)
  const { data, error, count } = await db
    .from('albums')
    .select(ALBUM_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) fail('Could not load albums', error)
  return { items: rows<Album>(data), total: count ?? 0 }
}

export async function getAdminUsers(db: SupabaseClient, page: number): Promise<Page<Profile>> {
  const { from, to } = range(page)
  const { data, error, count } = await db
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) fail('Could not load users', error)
  return { items: rows<Profile>(data), total: count ?? 0 }
}

export async function getAdminPlaylists(db: SupabaseClient, page: number): Promise<Page<Playlist>> {
  const { from, to } = range(page)
  const { data, error, count } = await db
    .from('playlists')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) fail('Could not load playlists', error)
  const withOwners = await attachOwners(db, rows<Playlist>(data))
  return { items: await attachPlaylistMeta(db, withOwners), total: count ?? 0 }
}

/** Compact lists for the <select> boxes in the admin forms. */
export async function getArtistOptions(db: SupabaseClient): Promise<{ id: string; name: string }[]> {
  const { data, error } = await db.from('artists').select('id, name').order('name', { ascending: true }).limit(1000)
  if (error) fail('Could not load artists', error)
  return rows<{ id: string; name: string }>(data)
}

export async function getAlbumOptions(db: SupabaseClient): Promise<{ id: string; title: string; artist_id: string }[]> {
  const { data, error } = await db
    .from('albums')
    .select('id, title, artist_id')
    .order('title', { ascending: true })
    .limit(1000)
  if (error) fail('Could not load albums', error)
  return rows<{ id: string; title: string; artist_id: string }>(data)
}
