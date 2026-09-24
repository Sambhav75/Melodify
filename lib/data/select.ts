/** Shared PostgREST select strings. */
export const ARTIST_MINI = 'id, name, image_url'
export const SONG_SELECT = `*, artist:artists(${ARTIST_MINI}), album:albums(id, title, cover_url)`
export const ALBUM_SELECT = `*, artist:artists(${ARTIST_MINI})`
