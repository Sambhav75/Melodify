'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/contexts/library-context'
import { cn } from '@/lib/utils'

const BOX = { sm: 'h-9 w-9', md: 'h-10 w-10', lg: 'h-12 w-12' } as const
const ICON = { sm: 'h-[18px] w-[18px]', md: 'h-5 w-5', lg: 'h-6 w-6' } as const

function HeartToggle({
  active,
  onToggle,
  labelOn,
  labelOff,
  size = 'md',
  variant = 'plain',
  className,
}: {
  active: boolean
  onToggle: () => void
  labelOn: string
  labelOff: string
  size?: keyof typeof BOX
  variant?: 'plain' | 'overlay'
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? labelOn : labelOff}
      title={active ? labelOn : labelOff}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90',
        BOX[size],
        variant === 'overlay' && 'bg-black/45 backdrop-blur-sm',
        active ? 'text-primary' : variant === 'overlay' ? 'text-white' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <Heart className={cn(ICON[size], active && 'fill-current')} />
    </button>
  )
}

/** Like / unlike a song (stored in the liked_songs table). */
export function LikeButton({
  songId,
  size,
  variant,
  className,
}: {
  songId: string
  size?: keyof typeof BOX
  variant?: 'plain' | 'overlay'
  className?: string
}) {
  const { isLiked, toggleLike } = useLibrary()
  return (
    <HeartToggle
      active={isLiked(songId)}
      onToggle={() => void toggleLike(songId)}
      labelOn="Remove from Liked Songs"
      labelOff="Save to Liked Songs"
      size={size}
      variant={variant}
      className={className}
    />
  )
}

export function SaveAlbumButton({ albumId, size, className }: { albumId: string; size?: keyof typeof BOX; className?: string }) {
  const { isAlbumSaved, toggleSaveAlbum } = useLibrary()
  return (
    <HeartToggle
      active={isAlbumSaved(albumId)}
      onToggle={() => void toggleSaveAlbum(albumId)}
      labelOn="Remove album from your library"
      labelOff="Save album to your library"
      size={size ?? 'lg'}
      className={className}
    />
  )
}

export function LikePlaylistButton({ playlistId, size, className }: { playlistId: string; size?: keyof typeof BOX; className?: string }) {
  const { isPlaylistLiked, toggleLikePlaylist } = useLibrary()
  return (
    <HeartToggle
      active={isPlaylistLiked(playlistId)}
      onToggle={() => void toggleLikePlaylist(playlistId)}
      labelOn="Remove playlist from your library"
      labelOff="Save playlist to your library"
      size={size ?? 'lg'}
      className={className}
    />
  )
}

export function FollowButton({ artistId, className }: { artistId: string; className?: string }) {
  const { isFollowing, toggleFollow } = useLibrary()
  const following = isFollowing(artistId)
  return (
    <Button
      variant={following ? 'outline' : 'secondary'}
      aria-pressed={following}
      className={className}
      onClick={() => void toggleFollow(artistId)}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
