import Link from 'next/link'
import { ClipboardList, MessageSquareText, PhoneCall } from 'lucide-react'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/landing/ScrollReveal'
import { CounterStat } from '@/components/landing/CounterStat'

const LOGOS = ['RIDGELINE HVAC', 'ATLAS PLUMBING', 'NORTHSTAR ROOFING', 'PRIME ELECTRIC', 'FOUNDATION DRAINS', 'IRONWORK MECHANICAL']

const PILLARS = [
  {
    title: 'Always On',
    body: 'Nights. Weekends. Holidays. Covered.',
  },
  {
    title: 'Instant Response',
    body: 'Your name. Your voice. Every time.',
  },
  {
    title: 'Zero Effort',
    body: 'Lead lands in your pocket. Not your voicemail.',
  },
]

const STEPS = [
  {
    number: '01',
    icon: PhoneCall,
    title: 'We pick up. You stay on the job.',
    body: 'Miss a call? We answer it. With your business name.',
  },
  {
    number: '02',
    icon: MessageSquareText,
    title: 'We get the details.',
    body: 'Name. Number. What they need. How urgent. Done.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'You get the lead. In 60 seconds.',
    body: 'Text hits your phone. Call them back first.',
  },
]

const SOCIAL_PROOF = [
  {
    name: 'Daniel Ortega',
    title: 'Ortega Plumbing',
    quote: 'First week. Evening calls stopped leaking.',
    image: 'https://i.pravatar.cc/400?img=12',
  },
  {
    name: 'Mia Patel',
    title: 'Harbor HVAC',
    quote: 'Clear summaries. Faster callbacks.',
    image: 'https://i.pravatar.cc/400?img=32',
  },
  {
    name: 'Chris Bowman',
    title: 'Bowman Electric',
    quote: 'Sounds like us. Every single time.',
    image: 'https://i.pravatar.cc/400?img=15',
  },
  {
    name: 'Ariana Lewis',
    title: 'Apex Roofing',
    quote: 'Voicemail cleanup? Gone.',
    image: 'https://i.pravatar.cc/400?img=24',
  },
  {
    name: 'Jared Kim',
    title: 'Kim Mechanical',
    quote: 'After-hours leads. Booked jobs.',
    image: 'https://i.pravatar.cc/400?img=59',
  },
  {
    name: 'Sofia Martin',
    title: 'Precision Drains',
    quote: 'One workflow. Zero chaos.',
    image: 'https://i.pravatar.cc/400?img=47',
  },
]

const PRICING_FEATURES = [
  'Unlimited answered calls',
  'Dedicated business number',
  'Instant lead text alerts',
  'Call recordings and transcripts',
  'Simple web dashboard',
]

export default function LandingPage() {
  return (
    <main className="bg-[var(--nm-white)] text-[var(--nm-black)]">
      <header className="border-b border-[var(--nm-border)]">
        <div className="landing-container h-16 flex items-center justify-between">
          <span className="text-sm tracking-[0.16em] uppercase font-medium">NeverMiss</span>
          <Link href="/login" className="text-sm text-[var(--nm-gray)] hover:text-[var(--nm-black)] transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <section className="nm-section">
        <div className="landing-container">
          <div className="landing-grid">
            <div className="col-span-12">
              <h1 className="text-[clamp(52px,11vw,96px)] leading-[0.92] tracking-[-0.04em] font-semibold">That call just went<br />to your competitor.</h1>
              <p className="mt-8 max-w-2xl text-[18px] md:text-[20px] text-[var(--nm-gray)] leading-[1.5]">
                We answer. We capture. You close.
              </p>
              <div className="mt-10">
                <Link href="/signup" className="nm-btn-primary">
                  Start now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nm-section border-y border-[var(--nm-border)]">
        <div className="landing-container text-center">
          <ScrollReveal>
            <p className="text-sm tracking-[0.12em] uppercase text-[var(--nm-gray)]">The math</p>
            <p className="mt-6 text-[clamp(70px,14vw,180px)] tracking-[-0.05em] leading-[0.95] font-semibold">
              <CounterStat end={130000} prefix="$" duration={2200} />
            </p>
            <p className="mt-6 text-[18px] md:text-[20px] text-[var(--nm-gray)] max-w-3xl mx-auto leading-[1.5]">
              One missed call a day. That&apos;s what it costs you.
            </p>
          </ScrollReveal>
          <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto" delayChildren={0.15}>
            <StaggerItem>
              <div className="border border-[var(--nm-border)] p-6 md:p-8">
                <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--nm-gray)]">Avg ticket value</p>
                <p className="mt-3 text-[40px] md:text-[52px] tracking-[-0.03em] font-semibold">
                  <CounterStat end={350} prefix="$" duration={1800} />
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="border border-[var(--nm-border)] p-6 md:p-8">
                <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--nm-gray)]">Alert speed</p>
                <p className="mt-3 text-[40px] md:text-[52px] tracking-[-0.03em] font-semibold">
                  <CounterStat end={60} suffix="s" duration={1400} />
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="border border-[var(--nm-border)] p-6 md:p-8">
                <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--nm-gray)]">Coverage</p>
                <p className="mt-3 text-[40px] md:text-[52px] tracking-[-0.03em] font-semibold">
                  24/<CounterStat end={7} duration={1000} />
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      <ScrollReveal>
        <section className="border-b border-[var(--nm-border)] py-10 md:py-14">
          <div className="landing-container">
            <p className="text-center text-sm text-[var(--nm-gray)]">Trusted by contractors across America</p>
            <StaggerContainer className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {LOGOS.map((logo) => (
                <StaggerItem key={logo}>
                  <div className="h-14 border border-[var(--nm-border)] bg-[var(--nm-soft)] text-[11px] tracking-[0.12em] text-[var(--nm-gray)] flex items-center justify-center text-center px-3">
                    {logo}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      <section className="nm-section">
        <div className="landing-container">
          <ScrollReveal>
            <h2 className="text-[38px] md:text-[56px] tracking-[-0.03em] leading-[1.05] font-semibold">Speed. Clarity. Control.</h2>
          </ScrollReveal>
          <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-3 border border-[var(--nm-border)]" delayChildren={0.1}>
            {PILLARS.map((pillar) => (
              <StaggerItem key={pillar.title} className="p-8 md:p-10 border-b md:border-b-0 md:border-r last:border-b-0 md:last:border-r-0 border-[var(--nm-border)]">
                <h3 className="text-[28px] tracking-[-0.02em] leading-[1.1] font-medium">{pillar.title}</h3>
                <p className="mt-4 text-[18px] text-[var(--nm-gray)] leading-[1.5]">{pillar.body}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="nm-section border-t border-[var(--nm-border)]">
        <div className="landing-container">
          <ScrollReveal>
            <h2 className="text-[38px] md:text-[56px] tracking-[-0.03em] leading-[1.05] font-semibold">How it works</h2>
          </ScrollReveal>
          <StaggerContainer className="mt-12 divide-y divide-[var(--nm-border)] border border-[var(--nm-border)]">
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 p-7 md:p-10">
                  <div className="md:col-span-2 text-[30px] md:text-[40px] tracking-[-0.03em] text-[var(--nm-gray)] font-medium">{step.number}</div>
                  <div className="md:col-span-1">
                    <step.icon className="w-5 h-5 mt-1" />
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="text-[26px] tracking-[-0.02em] leading-[1.15] font-medium">{step.title}</h3>
                    <p className="mt-3 text-[18px] text-[var(--nm-gray)] leading-[1.5]">{step.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="nm-section">
        <div className="landing-container">
          <ScrollReveal>
            <h2 className="text-[38px] md:text-[56px] tracking-[-0.03em] leading-[1.05] font-semibold">Don&apos;t take our word for it.</h2>
          </ScrollReveal>
          <StaggerContainer className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {SOCIAL_PROOF.map((person) => (
              <StaggerItem key={person.name}>
                <article className="border border-[var(--nm-border)] bg-[var(--nm-white)] h-full">
                  <img src={person.image} alt={person.name} className="w-full aspect-[4/3] object-cover grayscale" loading="lazy" />
                  <div className="p-5 md:p-6">
                    <p className="text-[20px] leading-[1.35] tracking-[-0.01em]">{person.quote}</p>
                    <p className="mt-5 text-[15px] font-medium">{person.name}</p>
                    <p className="mt-1 text-[14px] text-[var(--nm-gray)]">{person.title}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="nm-section">
        <div className="landing-container">
          <ScrollReveal>
            <div className="max-w-2xl border border-[var(--nm-border)] p-8 md:p-10">
              <p className="text-sm tracking-[0.12em] uppercase text-[var(--nm-gray)]">Pricing</p>
              <h2 className="mt-4 text-[40px] md:text-[56px] tracking-[-0.03em] leading-[1.02] font-semibold">$297/month</h2>
              <p className="mt-4 text-[18px] text-[var(--nm-gray)] leading-[1.5]">One plan. No surprises. Cancel anytime.</p>
              <ul className="mt-8 space-y-3 text-[17px] text-[var(--nm-black)]">
                {PRICING_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link href="/signup" className="nm-btn-primary mt-10 inline-flex">
                Start now
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="border-t border-[var(--nm-border)] py-10">
        <div className="landing-container flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <span className="text-sm tracking-[0.16em] uppercase font-medium">NeverMiss</span>
          <div className="flex items-center gap-6 text-sm text-[var(--nm-gray)]">
            <Link href="/login" className="hover:text-[var(--nm-black)] transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-[var(--nm-black)] transition-colors">Start now</Link>
          </div>
          <p className="text-sm text-[var(--nm-gray)]">© {new Date().getFullYear()} NeverMiss</p>
        </div>
      </footer>
    </main>
  )
}
