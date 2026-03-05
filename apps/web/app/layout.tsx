import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
