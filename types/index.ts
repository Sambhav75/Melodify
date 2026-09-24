export type Role = 'user' | 'admin'
export type AlbumType = 'album' | 'single' | 'ep'

export interface Profile {
  id: string
  username: string
  email: string | null
  avatar_url: string | null
  role: Role
  created_at: string
}

export interface ArtistMini {
  id: string
  name: string
  image_url: string | null
}

export interface Artist extends ArtistMini {
  biography: string | null
  created_at: string
}

export interface AlbumMini {
  id: string
  title: string
  cover_url: string | null
}

export interface Album extends AlbumMini {
  artist_id: string
  release_date: string | null
  album_type: AlbumType
  created_at: string
  artist?: ArtistMini | null
}

export interface Song {
  id: string
  title: string
  artist_id: string
  album_id: string | null
  audio_url: string
  cover_url: string | null
  duration: number
  genre: string | null
  release_date: string | null
  track_number: number | null
  play_count: number
  created_at: string
  artist?: ArtistMini | null
  album?: AlbumMini | null
}

export interface PlaylistOwner {
  id: string
  username: string
  avatar_url: string | null
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  created_at: string
  updated_at?: string
  owner?: PlaylistOwner | null
  song_count?: number
  cover_urls?: string[]
}

/** Slim playlist shape kept in the client-side library context. */
export interface PlaylistLite {
  id: string
  name: string
  is_public: boolean
  cover_image: string | null
}

export interface PlaylistTrack {
  id: string
  position: number
  added_at: string
  song: Song
}

export interface RecentlyPlayedItem {
  id: string
  played_at: string
  play_count: number
  song: Song
}

export interface SearchResults {
  query: string
  songs: Song[]
  artists: Artist[]
  albums: Album[]
  playlists: Playlist[]
}

export interface LibrarySnapshot {
  likedSongIds: string[]
  followedArtistIds: string[]
  savedAlbumIds: string[]
  likedPlaylistIds: string[]
  playlists: PlaylistLite[]
}

export type Result<T = null> = { ok: true; data: T } | { ok: false; error: string }
