import Link from 'next/link'
import { Phone } from 'lucide-react'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-16 flex items-center px-6 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">NeverMiss AI</span>
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
