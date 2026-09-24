import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Artist, Song } from '@/types'
import { uniqueBy } from '@/lib/utils'
import { SONG_SELECT } from './select'
import { rows } from './util'

export interface Recommendations {
  songs: Song[]
  artists: Artist[]
  /** Human readable explanation, e.g. "Because you listen to Lo-fi". Null when we only have popular songs. */
  reason: string | null
}

type Signal = { id: string; artist_id: string; genre: string | null }

function topKeys(scores: Map<string, number>, count: number): string[] {
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => key)
}

/**
 * Database-driven recommendations (no paid AI needed):
 *  1. Build taste profiles from recently played songs (weighted by replays), liked songs and followed artists.
 *  2. Fetch candidate songs from the top genres / artists.
 *  3. Rank by artist affinity + genre affinity + global popularity, hide songs already played or liked.
 *  4. Fall back to the most popular songs for brand-new listeners.
 *  5. "Similar artists" = other artists who make music in your favourite genres.
 */
export async function getRecommendations(db: SupabaseClient, userId: string, limit = 12): Promise<Recommendations> {
  const [recentRes, likedRes, followedRes, popularRes] = await Promise.all([
    db
      .from('recently_played')
      .select('play_count, song:songs(id, artist_id, genre)')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50),
    db
      .from('liked_songs')
      .select('song:songs(id, artist_id, genre)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('followed_artists').select('artist_id').eq('user_id', userId).limit(200),
    db
      .from('songs')
      .select(SONG_SELECT)
      .order('play_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40),
  ])

  const artistScore = new Map<string, number>()
  const genreScore = new Map<string, number>()
  const seen = new Set<string>()

  const bump = (song: Signal | null | undefined, weight: number) => {
    if (!song) return
    seen.add(song.id)
    artistScore.set(song.artist_id, (artistScore.get(song.artist_id) ?? 0) + weight)
    if (song.genre) genreScore.set(song.genre, (genreScore.get(song.genre) ?? 0) + weight)
  }

  for (const row of rows<{ play_count: number | null; song: Signal | null }>(recentRes.data)) {
    bump(row.song, 1 + Math.min(row.play_count ?? 1, 5)) // replays count for more
  }
  for (const row of rows<{ song: Signal | null }>(likedRes.data)) {
    bump(row.song, 3) // a like is a strong signal
  }
  const followed = new Set(rows<{ artist_id: string }>(followedRes.data).map((r) => r.artist_id))
  followed.forEach((id) => artistScore.set(id, (artistScore.get(id) ?? 0) + 4))

  const popular = rows<Song>(popularRes.data)
  const topGenres = topKeys(genreScore, 3)
  const topArtists = topKeys(artistScore, 3)

  // --- candidate songs -----------------------------------------------------
  const [byGenreRes, byArtistRes] = await Promise.all([
    topGenres.length
      ? db.from('songs').select(SONG_SELECT).in('genre', topGenres).order('play_count', { ascending: false }).limit(60)
      : null,
    topArtists.length
      ? db.from('songs').select(SONG_SELECT).in('artist_id', topArtists).order('play_count', { ascending: false }).limit(60)
      : null,
  ])

  const byGenre = rows<Song>(byGenreRes?.data)
  const candidates = uniqueBy([...byGenre, ...rows<Song>(byArtistRes?.data)], (s) => s.id)

  const score = (song: Song) =>
    (artistScore.get(song.artist_id) ?? 0) * 2 +
    (song.genre ? (genreScore.get(song.genre) ?? 0) : 0) +
    Math.log10((song.play_count ?? 0) + 1)

  let songs = candidates
    .filter((s) => !seen.has(s.id))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)

  if (songs.length < limit) {
    const have = new Set(songs.map((s) => s.id))
    // prefer songs the listener hasn't met yet, then allow repeats for small catalogues
    const unseen = popular.filter((s) => !have.has(s.id) && !seen.has(s.id))
    const repeats = popular.filter((s) => !have.has(s.id) && seen.has(s.id))
    songs = [...songs, ...unseen, ...repeats].slice(0, limit)
  }

  // --- similar artists -----------------------------------------------------
  let artists: Artist[] = []
  const similarIds = uniqueBy(
    byGenre.filter((s) => !topArtists.includes(s.artist_id) && !followed.has(s.artist_id)),
    (s) => s.artist_id,
  )
    .map((s) => s.artist_id)
    .slice(0, 8)

  if (similarIds.length > 0) {
    const { data } = await db.from('artists').select('*').in('id', similarIds)
    artists = rows<Artist>(data)
  }
  if (artists.length === 0) {
    const { data } = await db.from('artists').select('*').order('created_at', { ascending: false }).limit(12)
    const all = rows<Artist>(data)
    const fresh = all.filter((a) => !followed.has(a.id) && !topArtists.includes(a.id))
    artists = (fresh.length > 0 ? fresh : all).slice(0, 8)
  }

  const reason = topGenres.length > 0 ? `Because you listen to ${topGenres[0]}` : null
  return { songs, artists, reason }
}
