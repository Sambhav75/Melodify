'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { setAlbumSaved, setArtistFollowed, setPlaylistLiked, setSongLiked } from '@/lib/mutations'
import type { LibrarySnapshot, PlaylistLite, Result } from '@/types'

/** A Set of ids that supports instant (optimistic) updates and re-syncs when the server sends fresh data. */
function useIdSet(initial: string[]) {
  const [ids, setIds] = React.useState<Set<string>>(() => new Set(initial))
  const ref = React.useRef<Set<string>>(ids)

  React.useEffect(() => {
    const fresh = new Set(initial)
    ref.current = fresh
    setIds(fresh)
  }, [initial])

  const setMember = React.useCallback((id: string, value: boolean) => {
    const copy = new Set(ref.current)
    if (value) copy.add(id)
    else copy.delete(id)
    ref.current = copy
    setIds(copy)
  }, [])

  return { ids, ref, setMember }
}

type Mutate = (id: string, on: boolean) => Promise<Result>

/** Optimistic toggle: flip immediately, call the database, roll back on failure. */
function useToggle(
  ref: React.MutableRefObject<Set<string>>,
  setMember: (id: string, value: boolean) => void,
  mutate: Mutate,
  onMessage: string,
  offMessage: string,
) {
  return React.useCallback(
    async (id: string) => {
      const nextValue = !ref.current.has(id)
      setMember(id, nextValue)
      const result = await mutate(id, nextValue)
      if (!result.ok) {
        setMember(id, !nextValue)
        toast.error(result.error)
        return
      }
      toast.success(nextValue ? onMessage : offMessage)
    },
    [ref, setMember, mutate, onMessage, offMessage],
  )
}

export interface LibraryContextValue {
  likedCount: number
  isLiked: (songId: string) => boolean
  toggleLike: (songId: string) => Promise<void>
  isFollowing: (artistId: string) => boolean
  toggleFollow: (artistId: string) => Promise<void>
  isAlbumSaved: (albumId: string) => boolean
  toggleSaveAlbum: (albumId: string) => Promise<void>
  isPlaylistLiked: (playlistId: string) => boolean
  toggleLikePlaylist: (playlistId: string) => Promise<void>
  playlists: PlaylistLite[]
  addPlaylist: (playlist: PlaylistLite) => void
  patchPlaylist: (playlist: PlaylistLite) => void
  removePlaylist: (playlistId: string) => void
}

const LibraryContext = React.createContext<LibraryContextValue | null>(null)

export function useLibrary(): LibraryContextValue {
  const ctx = React.useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}

export function LibraryProvider({ initial, children }: { initial: LibrarySnapshot; children: React.ReactNode }) {
  const liked = useIdSet(initial.likedSongIds)
  const followed = useIdSet(initial.followedArtistIds)
  const saved = useIdSet(initial.savedAlbumIds)
  const likedPlaylists = useIdSet(initial.likedPlaylistIds)

  const [playlists, setPlaylists] = React.useState<PlaylistLite[]>(initial.playlists)
  React.useEffect(() => setPlaylists(initial.playlists), [initial.playlists])

  const toggleLike = useToggle(liked.ref, liked.setMember, setSongLiked, 'Added to Liked Songs', 'Removed from Liked Songs')
  const toggleFollow = useToggle(followed.ref, followed.setMember, setArtistFollowed, 'Following artist', 'Unfollowed artist')
  const toggleSaveAlbum = useToggle(saved.ref, saved.setMember, setAlbumSaved, 'Saved to your library', 'Removed from your library')
  const toggleLikePlaylist = useToggle(
    likedPlaylists.ref,
    likedPlaylists.setMember,
    setPlaylistLiked,
    'Playlist saved to your library',
    'Playlist removed from your library',
  )

  const addPlaylist = React.useCallback((playlist: PlaylistLite) => {
    setPlaylists((prev) => [playlist, ...prev.filter((p) => p.id !== playlist.id)])
  }, [])
  const patchPlaylist = React.useCallback((playlist: PlaylistLite) => {
    setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? playlist : p)))
  }, [])
  const removePlaylist = React.useCallback((playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
  }, [])

  const likedIds = liked.ids
  const followedIds = followed.ids
  const savedIds = saved.ids
  const likedPlaylistIds = likedPlaylists.ids

  const value = React.useMemo<LibraryContextValue>(
    () => ({
      likedCount: likedIds.size,
      isLiked: (id) => likedIds.has(id),
      toggleLike,
      isFollowing: (id) => followedIds.has(id),
      toggleFollow,
      isAlbumSaved: (id) => savedIds.has(id),
      toggleSaveAlbum,
      isPlaylistLiked: (id) => likedPlaylistIds.has(id),
      toggleLikePlaylist,
      playlists,
      addPlaylist,
      patchPlaylist,
      removePlaylist,
    }),
    [
      likedIds,
      followedIds,
      savedIds,
      likedPlaylistIds,
      toggleLike,
      toggleFollow,
      toggleSaveAlbum,
      toggleLikePlaylist,
      playlists,
      addPlaylist,
      patchPlaylist,
      removePlaylist,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
