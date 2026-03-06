import Link from 'next/link'

const MATH_STATS = [
  {
    number: '$130K',
    label: 'lost per year',
    detail: 'Missing 1 call a day at $500 average job value.',
  },
  {
    number: '78%',
    label: 'of callers never call back',
    detail: 'If you miss it, they move on. Simple as that.',
  },
  {
    number: '< 60s',
    label: 'to notify you',
    detail: 'Every captured lead, texted to you within a minute.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Customer calls your number',
    desc: 'Forward your existing line. Nothing changes for the caller.',
  },
  {
    step: '02',
    title: 'AI answers instantly',
    desc: 'Professional greeting, natural conversation, every detail captured.',
  },
  {
    step: '03',
    title: 'You get the lead',
    desc: 'Name, number, job type, urgency — all texted to you in under 60 seconds.',
  },
]

const FEATURES = [
  'Unlimited calls — no per-minute charges',
  'Dedicated AI phone number',
  'Instant SMS + email notifications',
  'Full call recordings and transcripts',
  'Lead pipeline dashboard',
  'Custom greeting for your trade',
  '24/7 AI coverage',
  'Mobile-friendly dashboard',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-extrabold text-lg tracking-tight text-[#FAFAFA]">NeverMiss</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#666666] hover:text-[#FAFAFA] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] text-sm font-bold px-4 py-2 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-left sm:text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 text-[#FAFAFA]">
            Every call answered.
            <br />
            <span className="text-[#F59E0B]">Every lead captured.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#666666] max-w-xl sm:mx-auto mb-10 leading-relaxed font-400">
            NeverMiss AI answers your calls 24/7, qualifies the lead, and texts you within 60 seconds. Built for contractors.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold px-8 py-4 text-base transition-colors"
          >
            Start Free Trial
          </Link>
          <p className="mt-4 text-sm text-[#666666]">$250/mo after 14-day trial. Cancel anytime.</p>
        </div>
      </section>

      {/* The Math */}
      <section className="py-24 px-4 sm:px-6 border-t border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#666666] mb-16 text-left sm:text-center">
            The math is not complicated
          </p>
          <div className="space-y-16">
            {MATH_STATS.map((stat) => (
              <div key={stat.number} className="border-b border-[#1A1A1A] pb-16 last:border-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 mb-2">
                  <span className="text-6xl sm:text-7xl font-extrabold text-[#FAFAFA] leading-none tabular-nums">
                    {stat.number}
                  </span>
                  <span className="text-xl sm:text-2xl font-600 text-[#666666] mt-2 sm:mt-0">
                    {stat.label}
                  </span>
                </div>
                <p className="text-[#666666] text-base mt-3 max-w-md">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 border-t border-[#1A1A1A]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#666666] mb-16 text-left sm:text-center">
            How it works
          </p>
          <div className="space-y-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className={`flex gap-8 sm:gap-12 items-start py-12 ${
                  i < HOW_IT_WORKS.length - 1 ? 'border-b border-[#1A1A1A]' : ''
                }`}
              >
                <span className="text-5xl sm:text-6xl font-extrabold text-[#1A1A1A] leading-none tabular-nums flex-shrink-0 select-none">
                  {item.step}
                </span>
                <div className="pt-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#FAFAFA] mb-2">{item.title}</h3>
                  <p className="text-[#666666] text-base leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 sm:px-6 border-t border-[#1A1A1A]">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#666666] mb-16 text-left sm:text-center">
            Pricing
          </p>
          <div className="bg-[#111111] border border-[#1A1A1A] p-8 sm:p-10">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-6xl font-extrabold text-[#FAFAFA] tabular-nums">$250</span>
              <span className="text-[#666666] text-lg">/mo</span>
            </div>
            <p className="text-[#666666] text-sm mb-10">14-day free trial included. No credit card required.</p>
            <ul className="space-y-4 mb-10">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#FAFAFA]">
                  <svg
                    className="w-4 h-4 text-[#F59E0B] flex-shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 8L6.5 12L13.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold py-4 text-center text-base transition-colors"
            >
              Start Free Trial
            </Link>
            <p className="text-center text-xs text-[#666666] mt-4">Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#666666]">
          <span className="font-extrabold text-[#FAFAFA] tracking-tight">NeverMiss</span>
          <p>&copy; {new Date().getFullYear()} NeverMiss. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#FAFAFA] transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-[#FAFAFA] transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
