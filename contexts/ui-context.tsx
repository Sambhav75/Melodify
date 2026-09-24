'use client'

import * as React from 'react'
import type { Song } from '@/types'

interface CreatePlaylistState {
  open: boolean
  /** Songs to drop into the playlist right after it is created. */
  songs: Song[]
}

export interface UIContextValue {
  queueOpen: boolean
  setQueueOpen: (open: boolean) => void
  toggleQueue: () => void
  nowPlayingOpen: boolean
  setNowPlayingOpen: (open: boolean) => void
  addToPlaylistSongs: Song[] | null
  openAddToPlaylist: (songs: Song[]) => void
  closeAddToPlaylist: () => void
  createPlaylistState: CreatePlaylistState
  openCreatePlaylist: (songs?: Song[]) => void
  closeCreatePlaylist: () => void
}

const UIContext = React.createContext<UIContextValue | null>(null)

export function useUI(): UIContextValue {
  const ctx = React.useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [queueOpen, setQueueOpen] = React.useState(false)
  const [nowPlayingOpen, setNowPlayingOpen] = React.useState(false)
  const [addToPlaylistSongs, setAddToPlaylistSongs] = React.useState<Song[] | null>(null)
  const [createPlaylistState, setCreatePlaylistState] = React.useState<CreatePlaylistState>({ open: false, songs: [] })

  const value = React.useMemo<UIContextValue>(
    () => ({
      queueOpen,
      setQueueOpen,
      toggleQueue: () => setQueueOpen((open) => !open),
      nowPlayingOpen,
      setNowPlayingOpen,
      addToPlaylistSongs,
      openAddToPlaylist: (songs) => setAddToPlaylistSongs(songs),
      closeAddToPlaylist: () => setAddToPlaylistSongs(null),
      createPlaylistState,
      openCreatePlaylist: (songs = []) => setCreatePlaylistState({ open: true, songs }),
      closeCreatePlaylist: () => setCreatePlaylistState({ open: false, songs: [] }),
    }),
    [queueOpen, nowPlayingOpen, addToPlaylistSongs, createPlaylistState],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
