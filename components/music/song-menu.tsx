'use client'

import { useRouter } from 'next/navigation'
import { Disc3, Ellipsis, Heart, Info, ListMusic, ListPlus, Share2, SkipForward, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlayer } from '@/contexts/audio-context'
import { useLibrary } from '@/contexts/library-context'
import { useUI } from '@/contexts/ui-context'
import { shareLink } from '@/lib/share'
import type { Song } from '@/types'

export interface MenuExtra {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

/** The "..." menu for a song: queue actions, playlists, likes, navigation and sharing. */
export function SongMenu({ song, extra, align = 'end' }: { song: Song; extra?: MenuExtra[]; align?: 'start' | 'end' }) {
  const router = useRouter()
  const { addToQueue, playNext } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()
  const { openAddToPlaylist } = useUI()
  const liked = isLiked(song.id)

  return (
    // modal={false} so opening a dialog from a menu item never leaves the page un-clickable
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`More options for ${song.title}`}
          onClick={(e) => e.stopPropagation()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => playNext(song)}>
          <SkipForward /> Play next
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => addToQueue(song)}>
          <ListPlus /> Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openAddToPlaylist([song])}>
          <ListMusic /> Add to playlist
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void toggleLike(song.id)}>
          <Heart /> {liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/artist/${song.artist_id}`)}>
          <User /> Go to artist
        </DropdownMenuItem>
        {song.album_id && (
          <DropdownMenuItem onSelect={() => router.push(`/album/${song.album_id}`)}>
            <Disc3 /> Go to album
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push(`/song/${song.id}`)}>
          <Info /> Song details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void shareLink(`/song/${song.id}`, song.title)}>
          <Share2 /> Share
        </DropdownMenuItem>
        {extra && extra.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {extra.map((item) => (
              <DropdownMenuItem
                key={item.label}
                destructive={item.destructive}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.icon && <item.icon />} {item.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
