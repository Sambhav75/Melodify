'use client'

import { createClient } from '@/lib/supabase/client'
import { SONG_SELECT } from '@/lib/data/select'
import type { Song } from '@/types'

/**
 * Browser-side loaders used by "play" buttons on cards, so we only download the tracks
 * when somebody actually presses play.
 */

function asSongs(data: unknown): Song[] {
  return (Array.isArray(data) ? data : []) as unknown as Song[]
}

export async function fetchAlbumSongs(albumId: string): Promise<Song[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('album_id', albumId)
    .order('track_number', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return asSongs(data)
}

export async function fetchPlaylistSongs(playlistId: string): Promise<Song[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('playlist_songs')
    .select(`position, song:songs(${SONG_SELECT})`)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)
  const rows = (Array.isArray(data) ? data : []) as unknown as { song: Song | null }[]
  return rows.map((r) => r.song).filter((s): s is Song => Boolean(s))
}

export async function fetchArtistSongs(artistId: string): Promise<Song[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_SELECT)
    .eq('artist_id', artistId)
    .order('play_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return asSongs(data)
}

/** Up to 500 of the newest liked songs. */
export async function fetchLikedSongs(offset = 0, limit = 500): Promise<Song[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('liked_songs')
    .select(`created_at, song:songs(${SONG_SELECT})`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw new Error(error.message)
  const rows = (Array.isArray(data) ? data : []) as unknown as { song: Song | null }[]
  return rows.map((r) => r.song).filter((s): s is Song => Boolean(s))
}
