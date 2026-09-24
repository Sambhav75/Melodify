import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Playlist, PlaylistOwner, PlaylistTrack } from '@/types'
import { getSupabase } from './auth'
import { SONG_SELECT } from './select'
import { fail, one, rows } from './util'

/** Adds `owner` (username + avatar only - never e-mail) to each playlist. */
export async function attachOwners(db: SupabaseClient, playlists: Playlist[]): Promise<Playlist[]> {
  if (playlists.length === 0) return playlists
  const ids = Array.from(new Set(playlists.map((p) => p.user_id)))
  const { data, error } = await db.rpc('get_public_profiles', { p_ids: ids })
  if (error) return playlists
  const owners = new Map(rows<PlaylistOwner>(data).map((o) => [o.id, o]))
  return playlists.map((p) => ({ ...p, owner: owners.get(p.user_id) ?? null }))
}

/** Adds `song_count` and up to four `cover_urls` (for the mosaic artwork). Decorative, so never throws. */
export async function attachPlaylistMeta(db: SupabaseClient, playlists: Playlist[]): Promise<Playlist[]> {
  if (playlists.length === 0) return playlists
  const ids = playlists.map((p) => p.id)

  const [countRes, coverRes] = await Promise.all([
    db.from('playlists').select('id, playlist_songs(count)').in('id', ids),
    db
      .from('playlist_songs')
      .select('playlist_id, position, song:songs(cover_url, album:albums(cover_url))')
      .in('playlist_id', ids)
      .lte('position', 4)
      .order('position', { ascending: true }),
  ])

  const counts = new Map<string, number>()
  for (const row of rows<{ id: string; playlist_songs: { count: number }[] | null }>(countRes.data)) {
    counts.set(row.id, row.playlist_songs?.[0]?.count ?? 0)
  }

  const covers = new Map<string, string[]>()
  type CoverRow = {
    playlist_id: string
    song: { cover_url: string | null; album: { cover_url: string | null } | null } | null
  }
  for (const row of rows<CoverRow>(coverRes.data)) {
    const url = row.song?.cover_url ?? row.song?.album?.cover_url ?? null
    if (!url) continue
    const list = covers.get(row.playlist_id) ?? []
    if (list.length < 4) list.push(url)
    covers.set(row.playlist_id, list)
  }

  return playlists.map((p) => ({
    ...p,
    song_count: counts.get(p.id) ?? 0,
    cover_urls: covers.get(p.id) ?? [],
  }))
}

export const getPlaylist = cache(async (id: string): Promise<Playlist | null> => {
  const db = await getSupabase()
  const { data, error } = await db.from('playlists').select('*').eq('id', id).maybeSingle()
  if (error) fail('Could not load playlist', error)
  const playlist = one<Playlist>(data)
  if (!playlist) return null
  const [withOwner] = await attachOwners(db, [playlist])
  return withOwner
})

export async function getPlaylistTracks(db: SupabaseClient, playlistId: string): Promise<PlaylistTrack[]> {
  const { data, error } = await db
    .from('playlist_songs')
    .select(`id, position, added_at, song:songs(${SONG_SELECT})`)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true })
    .limit(1000)
  if (error) fail('Could not load playlist tracks', error)
  return rows<PlaylistTrack>(data).filter((t) => t.song)
}

export async function getUserPlaylists(db: SupabaseClient, userId: string): Promise<Playlist[]> {
  const { data, error } = await db
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) fail('Could not load your playlists', error)
  return attachPlaylistMeta(db, rows<Playlist>(data))
}

export async function getPublicPlaylists(db: SupabaseClient, excludeUserId: string | null, limit = 12): Promise<Playlist[]> {
  let query = db.from('playlists').select('*').eq('is_public', true)
  if (excludeUserId) query = query.neq('user_id', excludeUserId)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) fail('Could not load public playlists', error)
  const withOwners = await attachOwners(db, rows<Playlist>(data))
  return attachPlaylistMeta(db, withOwners)
}

export async function getLikedPlaylists(db: SupabaseClient, userId: string): Promise<Playlist[]> {
  const { data, error } = await db
    .from('liked_playlists')
    .select('created_at, playlist:playlists(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) fail('Could not load saved playlists', error)
  const playlists = rows<{ playlist: Playlist | null }>(data)
    .map((r) => r.playlist)
    .filter((p): p is Playlist => Boolean(p))
  const withOwners = await attachOwners(db, playlists)
  return attachPlaylistMeta(db, withOwners)
}
