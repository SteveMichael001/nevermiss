import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'NeverMiss AI — AI Answering for Home Service Contractors',
  description:
    'Never miss a customer call again. AI answers your phone, captures leads, and texts you instantly.',
  metadataBase: new URL('https://nevermissai.com'),
  openGraph: {
    title: 'NeverMiss AI',
    description: 'AI phone answering for home service contractors',
    siteName: 'NeverMiss AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
