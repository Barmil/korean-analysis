import type { Metadata } from 'next'
import { ColorSchemeScript } from '@mantine/core'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Language Practice Gold',
  description: 'Language practice application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

