import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📞</span>
          <span className="font-bold text-gray-900">NeverMiss AI</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
