import Link from 'next/link'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="h-16 flex items-center px-6 md:px-10 border-b border-zinc-200">
        <Link href="/" className="font-sans font-medium text-sm tracking-widest uppercase text-black">
          NeverMiss
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  )
}
