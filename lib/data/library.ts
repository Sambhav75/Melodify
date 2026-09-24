import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Album, Artist, LibrarySnapshot, PlaylistLite, RecentlyPlayedItem, Song } from '@/types'
import { ALBUM_SELECT, SONG_SELECT } from './select'
import { fail, rows } from './util'

/** Pull every id of a per-user table (PostgREST returns max 1000 rows per request). */
async function fetchAllIds(db: SupabaseClient, table: string, column: string, userId: string): Promise<string[]> {
  const ids: string[] = []
  const pageSize = 1000
  for (let page = 0; page < 5; page++) {
    const { data, error } = await db
      .from(table)
      .select(column)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) fail(`Could not load ${table}`, error)
    const batch = rows<Record<string, string>>(data)
    for (const row of batch) ids.push(row[column])
    if (batch.length < pageSize) break
  }
  return ids
}

/** Everything the client needs to render hearts, follow buttons and the playlist picker. */
export async function getLibrarySnapshot(db: SupabaseClient, userId: string): Promise<LibrarySnapshot> {
  const [likedSongIds, followedArtistIds, savedAlbumIds, likedPlaylistIds, playlistsRes] = await Promise.all([
    fetchAllIds(db, 'liked_songs', 'song_id', userId),
    fetchAllIds(db, 'followed_artists', 'artist_id', userId),
    fetchAllIds(db, 'saved_albums', 'album_id', userId),
    fetchAllIds(db, 'liked_playlists', 'playlist_id', userId),
    db
      .from('playlists')
      .select('id, name, is_public, cover_image')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])
  if (playlistsRes.error) fail('Could not load playlists', playlistsRes.error)

  return {
    likedSongIds,
    followedArtistIds,
    savedAlbumIds,
    likedPlaylistIds,
    playlists: rows<PlaylistLite>(playlistsRes.data),
  }
}

export async function getLikedSongs(
  db: SupabaseClient,
  userId: string,
  offset = 0,
  limit = 50,
): Promise<{ songs: Song[]; total: number }> {
  const { data, error, count } = await db
    .from('liked_songs')
    .select(`created_at, song:songs(${SONG_SELECT})`, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) fail('Could not load liked songs', error)
  const songs = rows<{ song: Song | null }>(data)
    .map((r) => r.song)
    .filter((s): s is Song => Boolean(s))
  return { songs, total: count ?? songs.length }
}

export async function getFollowedArtists(db: SupabaseClient, userId: string, limit = 60): Promise<Artist[]> {
  const { data, error } = await db
    .from('followed_artists')
    .select('created_at, artist:artists(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load followed artists', error)
  return rows<{ artist: Artist | null }>(data)
    .map((r) => r.artist)
    .filter((a): a is Artist => Boolean(a))
}

export async function getSavedAlbums(db: SupabaseClient, userId: string, limit = 60): Promise<Album[]> {
  const { data, error } = await db
    .from('saved_albums')
    .select(`created_at, album:albums(${ALBUM_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load saved albums', error)
  return rows<{ album: Album | null }>(data)
    .map((r) => r.album)
    .filter((a): a is Album => Boolean(a))
}

export async function getRecentlyPlayed(db: SupabaseClient, userId: string, limit = 20): Promise<RecentlyPlayedItem[]> {
  const { data, error } = await db
    .from('recently_played')
    .select(`id, played_at, play_count, song:songs(${SONG_SELECT})`)
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit)
  if (error) fail('Could not load recently played', error)
  return rows<RecentlyPlayedItem>(data).filter((r) => r.song)
}
