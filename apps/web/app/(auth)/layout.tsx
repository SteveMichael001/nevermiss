import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="h-16 flex items-center px-6 md:px-10 border-b border-zinc-200">
        <Link href="/" className="font-sans font-medium text-sm tracking-widest uppercase text-black">
          NeverMiss
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
