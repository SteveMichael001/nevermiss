'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`nav-base ${scrolled ? 'nav-scrolled' : 'nav-transparent'}`}>
      <span
        className="font-display font-semibold text-base tracking-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        NeverMiss
      </span>
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="text-sm transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          Sign in
        </Link>
        <Link href="/signup" className="cta-primary text-sm py-2.5 px-5">
          Free trial
        </Link>
      </div>
    </nav>
  )
}
