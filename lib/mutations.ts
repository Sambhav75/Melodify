'use client'

import { createClient } from '@/lib/supabase/client'
import type { Playlist, Result } from '@/types'

/**
 * Client-side database mutations.
 * They run in the browser with the signed-in user's JWT, so Row Level Security decides
 * what is allowed (a user can only ever touch their own rows). No service-role key involved.
 */

const ok = <T,>(data: T): Result<T> => ({ ok: true, data })
const err = (error: string): { ok: false; error: string } => ({ ok: false, error })

export function friendlyError(error: unknown): string {
  const e = error as { message?: string; code?: string } | null
  const message = e?.message ?? ''
  if (e?.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return "You don't have permission to do that."
  }
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Network error. Check your connection and try again.'
  }
  return message || 'Something went wrong. Please try again.'
}

async function toggleRow(table: string, column: string, id: string, on: boolean): Promise<Result> {
  try {
    const supabase = createClient()
    if (on) {
      // user_id defaults to auth.uid() in the database
      const { error } = await supabase.from(table).insert({ [column]: id })
      if (error && error.code !== '23505') return err(friendlyError(error)) // 23505 = already there, fine
    } else {
      const { error } = await supabase.from(table).delete().eq(column, id)
      if (error) return err(friendlyError(error))
    }
    return ok(null)
  } catch (error) {
    return err(friendlyError(error))
  }
}

export const setSongLiked = (songId: string, liked: boolean) => toggleRow('liked_songs', 'song_id', songId, liked)
export const setArtistFollowed = (artistId: string, followed: boolean) =>
  toggleRow('followed_artists', 'artist_id', artistId, followed)
export const setAlbumSaved = (albumId: string, saved: boolean) => toggleRow('saved_albums', 'album_id', albumId, saved)
export const setPlaylistLiked = (playlistId: string, liked: boolean) =>
  toggleRow('liked_playlists', 'playlist_id', playlistId, liked)

/* -------------------------------- playlists -------------------------------- */

export async function createPlaylist(input: {
  name: string
  description?: string
  is_public?: boolean
}): Promise<Result<Playlist>> {
  const name = input.name.trim()
  if (!name) return err('Give your playlist a name.')
  if (name.length > 100) return err('Playlist names can be up to 100 characters.')
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('playlists')
      .insert({ name, description: input.description?.trim() || null, is_public: Boolean(input.is_public) })
      .select('*')
      .single()
    if (error) return err(friendlyError(error))
    return ok(data as unknown as Playlist)
  } catch (error) {
    return err(friendlyError(error))
  }
}

export async function updatePlaylist(
  id: string,
  patch: { name?: string; description?: string | null; is_public?: boolean; cover_image?: string | null },
): Promise<Result> {
  if (patch.name !== undefined && !patch.name.trim()) return err('Playlist name cannot be empty.')
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('playlists')
      .update({ ...patch, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}) })
      .eq('id', id)
    if (error) return err(friendlyError(error))
    return ok(null)
  } catch (error) {
    return err(friendlyError(error))
  }
}

export async function deletePlaylist(id: string): Promise<Result> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('playlists').delete().eq('id', id)
    if (error) return err(friendlyError(error))
    return ok(null)
  } catch (error) {
    return err(friendlyError(error))
  }
}

/** Resolves with the number of songs that were actually added (duplicates are skipped). */
export async function addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<Result<number>> {
  if (songIds.length === 0) return ok(0)
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('add_songs_to_playlist', {
      p_playlist_id: playlistId,
      p_song_ids: songIds,
    })
    if (error) return err(friendlyError(error))
    return ok(typeof data === 'number' ? data : 0)
  } catch (error) {
    return err(friendlyError(error))
  }
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<Result> {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('remove_song_from_playlist', {
      p_playlist_id: playlistId,
      p_song_id: songId,
    })
    if (error) return err(friendlyError(error))
    return ok(null)
  } catch (error) {
    return err(friendlyError(error))
  }
}

export async function reorderPlaylist(playlistId: string, songIds: string[]): Promise<Result> {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('reorder_playlist_songs', {
      p_playlist_id: playlistId,
      p_song_ids: songIds,
    })
    if (error) return err(friendlyError(error))
    return ok(null)
  } catch (error) {
    return err(friendlyError(error))
  }
}

/* --------------------------------- history --------------------------------- */

/** Fire-and-forget: upserts recently_played (no duplicates, trimmed to 50) and bumps the play counter. */
export async function recordPlay(songId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.rpc('record_play', { p_song_id: songId })
  } catch {
    // history is best-effort; never interrupt playback
  }
}
