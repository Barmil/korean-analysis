import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

