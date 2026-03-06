import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <nav className="h-16 flex items-center px-6 border-b border-[#1A1A1A]">
        <Link href="/" className="font-extrabold text-[#FAFAFA] tracking-tight">
          NeverMiss
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
