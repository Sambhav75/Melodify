'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { recordPlay } from '@/lib/mutations'
import { shuffleArray, songCover } from '@/lib/utils'
import type { Song } from '@/types'

/* -------------------------------------------------------------------------- */
/*  One global <audio> element for the whole app.                              */
/*  The provider lives in the ROOT layout, so playback never restarts while    */
/*  you navigate between pages.                                                */
/* -------------------------------------------------------------------------- */

let audioSingleton: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!audioSingleton) {
    audioSingleton = new Audio()
    audioSingleton.preload = 'auto'
  }
  return audioSingleton
}

export type RepeatMode = 'off' | 'all' | 'one'

export interface QueueItem {
  /** Unique per queue entry, so the same song can be queued twice. */
  uid: string
  song: Song
}

/* ------------------------------ queue reducer ----------------------------- */

interface QueueState {
  items: QueueItem[]
  /** Index of the current item in `items`, -1 when the queue is empty. */
  index: number
  /** Incremented whenever the current track must be (re)started. */
  nonce: number
  shuffle: boolean
  repeat: RepeatMode
  /** Original order (uids) remembered while shuffle is on, so it can be undone. */
  original: string[] | null
  /** Where the queue came from, e.g. "album:<id>" - lets play buttons show a pause icon. */
  source: string | null
}

type Action =
  | { type: 'SET_QUEUE'; songs: Song[]; startIndex: number; source: string | null }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'JUMP'; index: number }
  | { type: 'ADD'; songs: Song[]; mode: 'end' | 'next' }
  | { type: 'REMOVE'; uid: string }
  | { type: 'MOVE'; from: number; to: number }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_REPEAT'; mode: RepeatMode }
  | { type: 'RESET' }

const initialState: QueueState = {
  items: [],
  index: -1,
  nonce: 0,
  shuffle: false,
  repeat: 'off',
  original: null,
  source: null,
}

let uidCounter = 0
function makeItem(song: Song): QueueItem {
  uidCounter += 1
  return { uid: `q${Date.now().toString(36)}-${uidCounter.toString(36)}`, song }
}

function reducer(state: QueueState, action: Action): QueueState {
  switch (action.type) {
    case 'SET_QUEUE': {
      if (action.songs.length === 0) return state
      const start = Math.min(Math.max(action.startIndex, 0), action.songs.length - 1)
      let items = action.songs.map(makeItem)
      let index = start
      let original: string[] | null = null

      if (state.shuffle) {
        // the song you clicked plays first, the rest is shuffled
        original = items.map((i) => i.uid)
        const first = items[start]
        const rest = shuffleArray(items.filter((_, i) => i !== start))
        items = [first, ...rest]
        index = 0
      }
      return { ...state, items, index, original, source: action.source, nonce: state.nonce + 1 }
    }

    case 'NEXT': {
      if (state.items.length === 0) return state
      if (state.index < state.items.length - 1) {
        return { ...state, index: state.index + 1, nonce: state.nonce + 1 }
      }
      if (state.repeat === 'all') return { ...state, index: 0, nonce: state.nonce + 1 }
      return state
    }

    case 'PREV': {
      if (state.items.length === 0) return state
      if (state.index > 0) return { ...state, index: state.index - 1, nonce: state.nonce + 1 }
      if (state.repeat === 'all') return { ...state, index: state.items.length - 1, nonce: state.nonce + 1 }
      return { ...state, nonce: state.nonce + 1 }
    }

    case 'JUMP': {
      if (action.index < 0 || action.index >= state.items.length) return state
      return { ...state, index: action.index, nonce: state.nonce + 1 }
    }

    case 'ADD': {
      const added = action.songs.map(makeItem)
      if (added.length === 0) return state

      // Nothing queued yet: start playing what was added.
      if (state.items.length === 0) {
        return {
          ...state,
          items: added,
          index: 0,
          original: state.shuffle ? added.map((i) => i.uid) : null,
          source: null,
          nonce: state.nonce + 1,
        }
      }

      const original = state.original ? [...state.original, ...added.map((i) => i.uid)] : null
      if (action.mode === 'end') {
        return { ...state, items: [...state.items, ...added], original }
      }
      const at = state.index + 1
      return { ...state, items: [...state.items.slice(0, at), ...added, ...state.items.slice(at)], original }
    }

    case 'REMOVE': {
      const idx = state.items.findIndex((i) => i.uid === action.uid)
      if (idx === -1 || idx === state.index) return state // the playing track can't be removed
      return {
        ...state,
        items: state.items.filter((_, i) => i !== idx),
        index: idx < state.index ? state.index - 1 : state.index,
        original: state.original ? state.original.filter((u) => u !== action.uid) : null,
      }
    }

    case 'MOVE': {
      const { from, to } = action
      const last = state.items.length - 1
      if (from === to || from < 0 || to < 0 || from > last || to > last) return state
      const currentUid = state.items[state.index]?.uid
      const items = state.items.slice()
      const [moved] = items.splice(from, 1)
      items.splice(to, 0, moved)
      const index = currentUid ? items.findIndex((i) => i.uid === currentUid) : state.index
      return { ...state, items, index }
    }

    case 'CLEAR': {
      // Clears everything that is "up next"; the current song keeps playing.
      if (state.index < 0) return state
      const items = state.items.slice(0, state.index + 1)
      const keep = new Set(items.map((i) => i.uid))
      return { ...state, items, original: state.original ? state.original.filter((u) => keep.has(u)) : null }
    }

    case 'TOGGLE_SHUFFLE': {
      if (!state.shuffle) {
        const head = state.items.slice(0, state.index + 1)
        const tail = shuffleArray(state.items.slice(state.index + 1))
        return { ...state, shuffle: true, original: state.items.map((i) => i.uid), items: [...head, ...tail] }
      }

      // Turning shuffle off restores the original order (songs added meanwhile go to the end).
      if (!state.original) return { ...state, shuffle: false }
      const position = new Map(state.original.map((uid, i) => [uid, i] as const))
      const known = state.items
        .filter((i) => position.has(i.uid))
        .sort((a, b) => (position.get(a.uid) ?? 0) - (position.get(b.uid) ?? 0))
      const added = state.items.filter((i) => !position.has(i.uid))
      const items = [...known, ...added]
      const currentUid = state.items[state.index]?.uid
      const found = currentUid ? items.findIndex((i) => i.uid === currentUid) : -1
      return { ...state, shuffle: false, original: null, items, index: items.length === 0 ? -1 : Math.max(found, 0) }
    }

    case 'SET_REPEAT':
      return { ...state, repeat: action.mode }

    case 'RESET':
      return { ...initialState, shuffle: state.shuffle, repeat: state.repeat, nonce: state.nonce + 1 }

    default:
      return state
  }
}

/* --------------------------------- helpers -------------------------------- */

function handlePlayError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return // a newer load interrupted this one
    if (error.name === 'NotAllowedError') {
      toast.info('Press play to start playback')
      return
    }
    if (error.name === 'NotSupportedError') {
      toast.error("Your browser can't play this audio file")
      return
    }
  }
  toast.error('Unable to play this track')
}

const toArray = (songs: Song | Song[]): Song[] => (Array.isArray(songs) ? songs : [songs])

/* --------------------------------- contexts -------------------------------- */

export interface PlayerContextValue {
  current: Song | null
  currentUid: string | null
  source: string | null
  /** The whole queue in play order (played + current + upcoming). */
  queue: QueueItem[]
  queueIndex: number
  upcoming: QueueItem[]
  isPlaying: boolean
  isBuffering: boolean
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  hasNext: boolean
  hasPrevious: boolean
  playSongs: (songs: Song[], startIndex?: number, source?: string | null) => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (value: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (songs: Song | Song[]) => void
  playNext: (songs: Song | Song[]) => void
  removeFromQueue: (uid: string) => void
  moveQueueItem: (from: number, to: number) => void
  clearQueue: () => void
  jumpTo: (index: number) => void
  stop: () => void
}

interface PlayerTimeValue {
  currentTime: number
  duration: number
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null)
const PlayerTimeContext = React.createContext<PlayerTimeValue | null>(null)

export function usePlayer(): PlayerContextValue {
  const ctx = React.useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside <AudioProvider>')
  return ctx
}

/** Separate from usePlayer so only the progress bar re-renders on every timeupdate. */
export function usePlayerTime(): PlayerTimeValue {
  const ctx = React.useContext(PlayerTimeContext)
  if (!ctx) throw new Error('usePlayerTime must be used inside <AudioProvider>')
  return ctx
}

/* -------------------------------- provider -------------------------------- */

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<QueueState>(initialState)
  const stateRef = React.useRef<QueueState>(initialState)

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isBuffering, setIsBuffering] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolumeState] = React.useState(0.8)
  const [muted, setMuted] = React.useState(false)

  const errorStreak = React.useRef(0)
  const recordedNonce = React.useRef(-1)

  /** Point the audio element at the current queue item and start it. */
  const loadCurrent = React.useCallback((s: QueueState) => {
    const audio = getAudio()
    if (!audio) return
    const item = s.items[s.index]

    if (!item) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      setIsPlaying(false)
      setIsBuffering(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    audio.src = item.song.audio_url
    setCurrentTime(0)
    setDuration(item.song.duration || 0)
    setIsBuffering(true)
    // Called synchronously from the click handler, which keeps mobile browsers happy.
    const promise = audio.play()
    if (promise !== undefined) promise.catch(handlePlayError)
  }, [])

  /** Run the reducer against the latest state, then start the track if it changed. */
  const dispatch = React.useCallback(
    (action: Action) => {
      const prev = stateRef.current
      const next = reducer(prev, action)
      if (next === prev) return
      stateRef.current = next
      setState(next)
      if (next.nonce !== prev.nonce) loadCurrent(next)
    },
    [loadCurrent],
  )

  /* ---- audio element events ---- */
  React.useEffect(() => {
    const audio = getAudio()
    if (!audio) return

    try {
      const savedVolume = window.localStorage.getItem('melodify:volume')
      if (savedVolume !== null && Number.isFinite(Number(savedVolume))) {
        audio.volume = Math.min(1, Math.max(0, Number(savedVolume)))
      }
      audio.muted = window.localStorage.getItem('melodify:muted') === '1'
    } catch {
      // storage unavailable (private mode) - defaults are fine
    }
    setVolumeState(audio.volume)
    setMuted(audio.muted)

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      const s = stateRef.current
      if (recordedNonce.current !== s.nonce) {
        // count a listen once the song has really been played for a while
        const length = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 20
        if (audio.currentTime >= Math.min(10, length * 0.5)) {
          recordedNonce.current = s.nonce
          const song = s.items[s.index]?.song
          if (song) void recordPlay(song.id)
        }
      }
    }
    const onDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)
    const onPlaying = () => {
      setIsBuffering(false)
      errorStreak.current = 0
    }
    const onVolume = () => {
      setVolumeState(audio.volume)
      setMuted(audio.muted)
    }
    const onEnded = () => {
      const s = stateRef.current
      if (s.repeat === 'one') {
        audio.currentTime = 0
        const promise = audio.play()
        if (promise !== undefined) promise.catch(handlePlayError)
        return
      }
      const isLast = s.index >= s.items.length - 1
      if (isLast && s.repeat === 'off') {
        setIsPlaying(false)
        audio.currentTime = 0
        setCurrentTime(0)
        return
      }
      dispatch({ type: 'NEXT' })
    }
    const onError = () => {
      if (!audio.getAttribute('src')) return // we just cleared the source ourselves
      const s = stateRef.current
      const item = s.items[s.index]
      if (!item) return
      errorStreak.current += 1
      setIsBuffering(false)
      setIsPlaying(false)
      toast.error(`Couldn't load "${item.song.title}". Check that the audio file is reachable.`)
      // skip ahead, but give up after 3 failures in a row so we never loop forever
      if (errorStreak.current < 3 && s.index < s.items.length - 1) dispatch({ type: 'NEXT' })
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('volumechange', onVolume)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('volumechange', onVolume)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [dispatch])

  /* ---- actions ---- */
  const playSongs = React.useCallback(
    (songs: Song[], startIndex = 0, source: string | null = null) => {
      dispatch({ type: 'SET_QUEUE', songs, startIndex, source })
    },
    [dispatch],
  )

  const togglePlay = React.useCallback(() => {
    const audio = getAudio()
    if (!audio || !stateRef.current.items[stateRef.current.index]) return
    if (audio.paused) {
      const promise = audio.play()
      if (promise !== undefined) promise.catch(handlePlayError)
    } else {
      audio.pause()
    }
  }, [])

  const next = React.useCallback(() => dispatch({ type: 'NEXT' }), [dispatch])

  const previous = React.useCallback(() => {
    const audio = getAudio()
    const s = stateRef.current
    // Like most players: restart the song if it is already a few seconds in
    if (audio && (audio.currentTime > 3 || (s.index <= 0 && s.repeat !== 'all'))) {
      audio.currentTime = 0
      setCurrentTime(0)
      return
    }
    dispatch({ type: 'PREV' })
  }, [dispatch])

  const seek = React.useCallback((seconds: number) => {
    const audio = getAudio()
    if (!audio || !Number.isFinite(seconds)) return
    audio.currentTime = Math.max(0, seconds)
    setCurrentTime(audio.currentTime)
  }, [])

  const setVolume = React.useCallback((value: number) => {
    const audio = getAudio()
    if (!audio) return
    const clamped = Math.min(1, Math.max(0, value))
    audio.volume = clamped
    if (clamped > 0 && audio.muted) audio.muted = false
    try {
      window.localStorage.setItem('melodify:volume', String(clamped))
      window.localStorage.setItem('melodify:muted', audio.muted ? '1' : '0')
    } catch {
      // ignore
    }
  }, [])

  const toggleMute = React.useCallback(() => {
    const audio = getAudio()
    if (!audio) return
    audio.muted = !audio.muted
    try {
      window.localStorage.setItem('melodify:muted', audio.muted ? '1' : '0')
    } catch {
      // ignore
    }
  }, [])

  const toggleShuffle = React.useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), [dispatch])

  const cycleRepeat = React.useCallback(() => {
    const order: RepeatMode[] = ['off', 'all', 'one']
    const nextMode = order[(order.indexOf(stateRef.current.repeat) + 1) % order.length]
    dispatch({ type: 'SET_REPEAT', mode: nextMode })
  }, [dispatch])

  const addToQueue = React.useCallback(
    (songs: Song | Song[]) => {
      const list = toArray(songs)
      if (list.length === 0) return
      dispatch({ type: 'ADD', songs: list, mode: 'end' })
      toast.success(list.length === 1 ? 'Added to queue' : `Added ${list.length} songs to queue`)
    },
    [dispatch],
  )

  const playNext = React.useCallback(
    (songs: Song | Song[]) => {
      const list = toArray(songs)
      if (list.length === 0) return
      dispatch({ type: 'ADD', songs: list, mode: 'next' })
      toast.success(list.length === 1 ? 'Playing next' : `${list.length} songs will play next`)
    },
    [dispatch],
  )

  const removeFromQueue = React.useCallback((uid: string) => dispatch({ type: 'REMOVE', uid }), [dispatch])
  const moveQueueItem = React.useCallback((from: number, to: number) => dispatch({ type: 'MOVE', from, to }), [dispatch])
  const clearQueue = React.useCallback(() => dispatch({ type: 'CLEAR' }), [dispatch])
  const jumpTo = React.useCallback((index: number) => dispatch({ type: 'JUMP', index }), [dispatch])
  const stop = React.useCallback(() => dispatch({ type: 'RESET' }), [dispatch])

  /* ---- Media Session (lock-screen / headset controls) ---- */
  const currentSong = state.items[state.index]?.song ?? null

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    if (!currentSong) {
      navigator.mediaSession.metadata = null
      return
    }
    const cover = songCover(currentSong)
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist?.name ?? '',
        album: currentSong.album?.title ?? '',
        artwork: cover ? [{ src: new URL(cover, window.location.origin).toString(), sizes: '512x512' }] : [],
      })
    } catch {
      // some browsers reject unusual artwork; playback is unaffected
    }
  }, [currentSong])

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // action not supported on this platform
      }
    }
    set('play', () => {
      const promise = getAudio()?.play()
      if (promise !== undefined) promise.catch(handlePlayError)
    })
    set('pause', () => getAudio()?.pause())
    set('previoustrack', () => previous())
    set('nexttrack', () => next())
    set('seekto', (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime)
    })
    return () => {
      const actions: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto']
      actions.forEach((action) => set(action, null))
    }
  }, [previous, next, seek])

  /* ---- context values ---- */
  const value = React.useMemo<PlayerContextValue>(
    () => ({
      current: currentSong,
      currentUid: state.items[state.index]?.uid ?? null,
      source: state.source,
      queue: state.items,
      queueIndex: state.index,
      upcoming: state.index >= 0 ? state.items.slice(state.index + 1) : [],
      isPlaying,
      isBuffering,
      volume,
      muted,
      shuffle: state.shuffle,
      repeat: state.repeat,
      hasNext: state.index >= 0 && (state.index < state.items.length - 1 || state.repeat === 'all'),
      hasPrevious: state.index >= 0,
      playSongs,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      moveQueueItem,
      clearQueue,
      jumpTo,
      stop,
    }),
    [
      state,
      currentSong,
      isPlaying,
      isBuffering,
      volume,
      muted,
      playSongs,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      moveQueueItem,
      clearQueue,
      jumpTo,
      stop,
    ],
  )

  const timeValue = React.useMemo<PlayerTimeValue>(() => ({ currentTime, duration }), [currentTime, duration])

  return (
    <PlayerContext.Provider value={value}>
      <PlayerTimeContext.Provider value={timeValue}>{children}</PlayerTimeContext.Provider>
    </PlayerContext.Provider>
  )
}
