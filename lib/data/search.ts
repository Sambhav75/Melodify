import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Album, Artist, Playlist, SearchResults, Song } from '@/types'
import { escapeLike, uniqueBy } from '@/lib/utils'
import { attachOwners, attachPlaylistMeta } from './playlists'
import { ALBUM_SELECT, SONG_SELECT } from './select'
import { fail, rows } from './util'

/**
 * Real search across songs (title, genre, artist, album), artists, albums and playlists.
 * Playlist visibility is enforced by Row Level Security (public or your own).
 */
export async function searchAll(db: SupabaseClient, rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim().slice(0, 80)
  if (!query) return { query, songs: [], artists: [], albums: [], playlists: [] }

  const pattern = `%${escapeLike(query)}%`

  const [artistsRes, albumsRes, playlistsRes, titleRes, genreRes] = await Promise.all([
    db.from('artists').select('*').ilike('name', pattern).limit(8),
    db.from('albums').select(ALBUM_SELECT).ilike('title', pattern).limit(8),
    db.from('playlists').select('*').ilike('name', pattern).limit(8),
    db.from('songs').select(SONG_SELECT).ilike('title', pattern).order('play_count', { ascending: false }).limit(20),
    db.from('songs').select(SONG_SELECT).ilike('genre', pattern).order('play_count', { ascending: false }).limit(20),
  ])

  for (const res of [artistsRes, albumsRes, playlistsRes, titleRes, genreRes]) {
    if (res.error) fail('Search failed', res.error)
  }

  const artists = rows<Artist>(artistsRes.data)
  const albums = rows<Album>(albumsRes.data)

  // Songs that belong to a matching artist or album.
  const [byArtistRes, byAlbumRes] = await Promise.all([
    artists.length
      ? db.from('songs').select(SONG_SELECT).in('artist_id', artists.map((a) => a.id)).limit(20)
      : null,
    albums.length
      ? db.from('songs').select(SONG_SELECT).in('album_id', albums.map((a) => a.id)).limit(20)
      : null,
  ])

  const songs = uniqueBy(
    [
      ...rows<Song>(titleRes.data),
      ...rows<Song>(byArtistRes?.data),
      ...rows<Song>(byAlbumRes?.data),
      ...rows<Song>(genreRes.data),
    ],
    (s) => s.id,
  ).slice(0, 30)

  const playlistsWithOwners = await attachOwners(db, rows<Playlist>(playlistsRes.data))
  const playlists = await attachPlaylistMeta(db, playlistsWithOwners)

  return { query, songs, artists, albums, playlists }
}
