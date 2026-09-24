'use client'

import * as React from 'react'
import { AddToPlaylistDialog } from '@/components/music/add-to-playlist-dialog'
import { CreatePlaylistDialog } from '@/components/music/create-playlist-dialog'
import { LibraryProvider } from '@/contexts/library-context'
import { UIProvider } from '@/contexts/ui-context'
import type { LibrarySnapshot } from '@/types'
import { ExpandedPlayer } from './expanded-player'
import { MobileNav } from './mobile-nav'
import { PlayerBar } from './player-bar'
import { QueuePanel } from './queue-panel'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import type { ProfileLite } from './user-menu'

/**
 * The signed-in layout: sidebar (bottom bar on phones), scrolling content, floating player dock.
 * It is mounted once by app/(app)/layout.tsx, so it - and the music - survive page navigation.
 */
export function AppShell({
  profile,
  library,
  children,
}: {
  profile: ProfileLite
  library: LibrarySnapshot
  children: React.ReactNode
}) {
  return (
    <LibraryProvider initial={library}>
      <UIProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <div className="flex h-dvh flex-col bg-background">
          <div className="flex min-h-0 flex-1 gap-2 md:p-2 md:pb-0">
            <Sidebar isAdmin={profile.role === 'admin'} />
            <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-card/60 md:rounded-3xl">
              <Topbar profile={profile} />
              <main id="main" className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10">
                {children}
              </main>
              <QueuePanel />
            </div>
          </div>
          <PlayerBar />
          <MobileNav />
        </div>
        <ExpandedPlayer />
        <AddToPlaylistDialog />
        <CreatePlaylistDialog />
      </UIProvider>
    </LibraryProvider>
  )
}
