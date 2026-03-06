import Link from 'next/link'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="h-16 flex items-center px-6 border-b border-[#1A1A1A]">
        <Link href="/" className="font-extrabold text-[#FAFAFA] tracking-tight">
          NeverMiss
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
