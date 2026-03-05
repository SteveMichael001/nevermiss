import Link from 'next/link'
import { Phone, MessageSquare, BarChart3, Clock, Shield, Zap, CheckCircle } from 'lucide-react'

const TRADES = [
  { icon: '🔧', name: 'Plumbing' },
  { icon: '❄️', name: 'HVAC' },
  { icon: '⚡', name: 'Electrical' },
  { icon: '🏠', name: 'Roofing' },
  { icon: '🐛', name: 'Pest Control' },
  { icon: '🌿', name: 'Landscaping' },
]

const FEATURES = [
  {
    icon: Phone,
    title: 'AI Answers Every Call',
    description:
      'Our AI picks up instantly — day or night, weekday or weekend. No more missed leads while you\'re on a job.',
  },
  {
    icon: MessageSquare,
    title: 'Instant SMS Alerts',
    description:
      'Get a text within 60 seconds of every call with the caller\'s name, phone, and what they need.',
  },
  {
    icon: BarChart3,
    title: 'Lead Dashboard',
    description:
      'Track every lead from new to booked. Replay call recordings. Manage your pipeline from your phone.',
  },
  {
    icon: Clock,
    title: '24/7 Coverage',
    description:
      'You sleep. Your AI doesn\'t. Emergency calls get flagged immediately so you can decide when to respond.',
  },
  {
    icon: Shield,
    title: 'Sounds Like Your Business',
    description:
      'Custom greetings trained on your trade. Callers get a professional, knowledgeable response every time.',
  },
  {
    icon: Zap,
    title: 'Setup in 5 Minutes',
    description:
      'Sign up, get your AI number, forward your calls. That\'s it. No hardware, no training, no IT department.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <span className="font-bold text-lg text-gray-900">NeverMiss AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            14-day free trial — no credit card required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Your AI answers every call.{' '}
            <span className="text-brand">You never miss a lead.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            NeverMiss AI picks up your calls 24/7, has a natural conversation with the
            caller, captures their info, and texts you instantly. Built for home service
            contractors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-green-200"
            >
              Start Your Free Trial →
            </Link>
            <p className="text-sm text-gray-400">$250/mo after trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Trade badges */}
      <section className="py-12 px-4 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
            Built for your trade
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TRADES.map((trade) => (
              <span
                key={trade.name}
                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-sm"
              >
                <span>{trade.icon}</span>
                {trade.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-center text-gray-500 mb-14">
            From missed call to booked job in under 60 seconds.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Customer calls',
                desc: 'They dial your regular number — you just have call forwarding set up.',
              },
              {
                step: '2',
                title: 'AI answers',
                desc: 'Your AI picks up instantly with your business greeting and captures their info.',
              },
              {
                step: '3',
                title: 'You get a text',
                desc: 'Within 60 seconds: caller name, phone, what they need, how urgent.',
              },
              {
                step: '4',
                title: 'You call back, win the job',
                desc: 'Tap to call from the SMS. Customer\'s info is already in your dashboard.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-center text-gray-500 mb-14">
            Simple, powerful, built for contractors who are too busy to miss a call.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            One plan. One price. No surprises.
          </h2>
          <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-extrabold">$250</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-green-400 font-medium mb-8">14-day free trial included</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited calls — no per-minute charges',
                'Dedicated AI phone number',
                'Instant SMS + email notifications',
                'Full call recordings & transcripts',
                'Lead pipeline dashboard',
                'Custom greeting for your trade',
                '24/7 AI coverage',
                'Mobile-friendly dashboard',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl text-center text-lg transition-colors"
            >
              Start Free Trial →
            </Link>
            <p className="text-center text-xs text-gray-500 mt-4">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>📞</span>
            <span className="font-semibold text-gray-600">NeverMiss AI</span>
          </div>
          <p>© {new Date().getFullYear()} NeverMiss AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-gray-600 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-gray-600 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
