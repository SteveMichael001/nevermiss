import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 border-b border-zinc-900 bg-black/90 backdrop-blur-sm">
        <span className="font-sans font-medium text-sm tracking-widest uppercase text-white">
          NeverMiss
        </span>
        <div className="flex items-center gap-8">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium tracking-widest uppercase bg-white text-black px-5 py-2.5 hover:bg-zinc-200 transition-colors"
          >
            Free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-10 pb-20 pt-32 overflow-hidden border-b border-zinc-900">
        
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Ghost stat — decorative */}
        <div className="absolute bottom-16 right-6 md:right-10 text-right pointer-events-none select-none">
          <div className="font-serif text-7xl md:text-9xl text-zinc-900 leading-none tracking-tight">
            $130K
          </div>
          <div className="text-xs tracking-widest uppercase text-zinc-800 mt-1">
            missed per year
          </div>
        </div>

        {/* Ghost phone mockup */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 md:w-80 opacity-10 pointer-events-none select-none hidden md:block">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-5 mx-auto w-56">
            <div className="text-center text-zinc-700 text-xs tracking-widest uppercase mb-5">9:41</div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-950 rounded-lg flex items-center justify-center text-red-400 text-sm flex-shrink-0">↘</div>
              <div>
                <div className="text-red-400 text-xs tracking-wider uppercase mb-0.5">Missed call</div>
                <div className="text-white text-sm font-medium">Unknown Caller</div>
                <div className="text-zinc-600 text-xs mt-0.5">Just now</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs tracking-widest uppercase text-zinc-600 mb-8 font-sans">
            AI voicemail for contractors
          </p>

          <h1 className="font-serif italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.92] tracking-tight text-white mb-10">
            That call just went<br />
            to your competitor.
          </h1>

          <p className="text-sm md:text-base text-zinc-500 leading-relaxed mb-12 max-w-md font-sans">
            NeverMiss answers every call you can&apos;t.<br />
            Captures the lead. Texts you in 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 bg-white text-black text-xs font-medium tracking-widest uppercase px-7 py-4 hover:bg-zinc-200 transition-colors"
            >
              Start free trial <span>→</span>
            </Link>
            <span className="text-xs text-zinc-700 tracking-wide">
              14 days free · No card required
            </span>
          </div>
        </div>
      </section>

      {/* The Math */}
      <section className="px-6 md:px-10 py-24 border-b border-zinc-900">
        <div className="max-w-2xl">
          <p className="text-xs tracking-widest uppercase text-zinc-600 mb-12 font-sans">The math</p>
          <div className="space-y-10">
            <div>
              <div className="font-serif text-4xl md:text-5xl text-white leading-tight">
                1 missed call per day.
              </div>
            </div>
            <div>
              <div className="font-serif text-4xl md:text-5xl text-zinc-500 leading-tight">
                Average job: $500.
              </div>
            </div>
            <div>
              <div className="font-serif text-4xl md:text-5xl text-white leading-tight">
                That&apos;s $130,000 a year<br />
                walking out the door.
              </div>
            </div>
            <div className="pt-4">
              <div className="font-serif italic text-2xl md:text-3xl text-zinc-400 leading-tight">
                NeverMiss costs $250/month.<br />
                One job pays for the year.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — no header, just numbered */}
      <section className="px-6 md:px-10 py-24 border-b border-zinc-900">
        <div className="max-w-2xl space-y-16">
          {[
            {
              n: '01',
              title: 'You miss a call.',
              body: 'You\'re on the job. Hands dirty. Can\'t pick up. The phone rings anyway.',
            },
            {
              n: '02',
              title: 'NeverMiss answers.',
              body: 'Your AI picks up instantly. Speaks your business name. Gets their name, number, and what they need.',
            },
            {
              n: '03',
              title: 'You get a text.',
              body: 'Within 60 seconds: caller name, number, job type, urgency. Tap to call back. Job won.',
            },
          ].map((step) => (
            <div key={step.n} className="flex gap-8 md:gap-16">
              <div className="font-serif text-5xl md:text-6xl text-zinc-800 leading-none w-16 flex-shrink-0 select-none">
                {step.n}
              </div>
              <div>
                <h3 className="font-sans font-medium text-lg text-white mb-3">{step.title}</h3>
                <p className="font-sans text-sm text-zinc-500 leading-relaxed max-w-sm">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Without / With */}
      <section className="px-6 md:px-10 py-24 border-b border-zinc-900">
        <div className="grid md:grid-cols-2 gap-0 border border-zinc-800 max-w-3xl">
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-zinc-800">
            <p className="text-xs tracking-widest uppercase text-zinc-600 mb-8">Without NeverMiss</p>
            <ul className="space-y-5 text-sm text-zinc-500 leading-relaxed font-sans">
              <li>Phone rings while you&apos;re on the job</li>
              <li>Call goes to voicemail</li>
              <li>Caller hangs up</li>
              <li>They call the next plumber</li>
              <li>You find out two days later</li>
              <li className="text-zinc-700">— or never</li>
            </ul>
          </div>
          <div className="p-8 md:p-12">
            <p className="text-xs tracking-widest uppercase text-zinc-400 mb-8">With NeverMiss</p>
            <ul className="space-y-5 text-sm text-white leading-relaxed font-sans">
              <li>Phone rings while you&apos;re on the job</li>
              <li>NeverMiss answers instantly</li>
              <li>Lead captured in 60 seconds</li>
              <li>You get a text with everything</li>
              <li>You call back when you&apos;re free</li>
              <li className="text-zinc-400">— job won</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Social proof — one quote, raw */}
      <section className="px-6 md:px-10 py-24 border-b border-zinc-900">
        <div className="max-w-2xl">
          <blockquote className="font-serif italic text-2xl md:text-3xl text-white leading-relaxed mb-8">
            &ldquo;I used to lose 3 or 4 calls a week and not even know it.
            First month with NeverMiss I picked up 6 jobs I would&apos;ve missed.&rdquo;
          </blockquote>
          <p className="text-xs tracking-widest uppercase text-zinc-600 font-sans">
            Mike T. — HVAC contractor, San Diego
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 md:px-10 py-24 border-b border-zinc-900">
        <div className="max-w-md">
          <p className="text-xs tracking-widest uppercase text-zinc-600 mb-12 font-sans">Pricing</p>
          
          <div className="border border-zinc-800 p-8 md:p-10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-serif text-6xl text-white">$250</span>
              <span className="text-zinc-600 text-sm font-sans">/month</span>
            </div>
            <p className="text-sm text-zinc-600 mb-10 font-sans">14-day free trial. No card required to start.</p>
            
            <ul className="space-y-4 mb-10">
              {[
                'Unlimited calls — no per-minute fees',
                'Dedicated AI phone number',
                'Instant SMS alerts — every call',
                'Full recordings and transcripts',
                'Lead dashboard on your phone',
                'Custom greeting for your trade',
                '24/7 coverage',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-400 font-sans">
                  <span className="text-zinc-700 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full text-center bg-white text-black text-xs font-medium tracking-widest uppercase py-4 hover:bg-zinc-200 transition-colors font-sans"
            >
              Start free trial →
            </Link>
            <p className="text-center text-xs text-zinc-700 mt-4 font-sans tracking-wide">
              Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-8 flex items-center justify-between text-xs text-zinc-700 font-sans tracking-wide">
        <span className="uppercase tracking-widest font-medium text-zinc-500">NeverMiss</span>
        <span>© {new Date().getFullYear()}</span>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
