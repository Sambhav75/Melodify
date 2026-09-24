import type { Metadata, Viewport } from 'next'
import { Figtree, Unbounded } from 'next/font/google'
import { Toaster } from 'sonner'
import { AudioProvider } from '@/contexts/audio-context'
import './globals.css'

const sans = Figtree({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Unbounded({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Melodify - Listen to your music anywhere',
    template: '%s - Melodify',
  },
  description:
    'Melodify is a music streaming platform: build playlists, like songs, follow artists and keep listening wherever you are.',
  applicationName: 'Melodify',
}

export const viewport: Viewport = {
  themeColor: '#0f0b1a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // lets the bottom nav use the iPhone safe-area inset
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} dark`}>
      <body className="min-h-dvh">
        {/* The audio provider sits at the very top so music keeps playing across every page. */}
        <AudioProvider>{children}</AudioProvider>
        <Toaster
          theme="dark"
          position="top-center"
          closeButton
          toastOptions={{
            classNames: {
              toast: '!rounded-2xl !border-border !bg-popover !text-foreground',
            },
          }}
        />
      </body>
    </html>
  )
}
