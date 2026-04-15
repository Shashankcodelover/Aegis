import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEGIS — ZK Behavioral Proof CSRF Defense',
  description:
    'Zero-Knowledge Behavioral Proof CSRF Defense System — Node 1 Defender',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
