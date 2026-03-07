import Link from 'next/link'
import { Activity, Bot, Eye, FileText, MessageSquareText, PhoneOff, TrendingUp } from 'lucide-react'
import { NavBar } from '@/components/landing/NavBar'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/landing/ScrollReveal'
import { CounterStat } from '@/components/landing/CounterStat'

const TRUST_BADGES = ['24/7 Coverage', '60-Sec Alerts', 'No Per-Min Fees', 'Full Transcripts']

const LOGOS = ['WEST COAST HVAC', 'PACIFIC PLUMBING', 'COAST ELECTRIC', 'SUNSET ROOFING', 'BLUE LINE DRAINS']

const STEPS = [
  {
    n: '01',
    title: 'Call goes unanswered',
    body: "You're in a crawlspace, on a ladder, or with a customer. The phone still rings.",
    icon: PhoneOff,
  },
  {
    n: '02',
    title: 'NeverMiss takes over',
    body: 'Your AI answers instantly, says your company name, and captures caller details and job intent.',
    icon: Bot,
  },
  {
    n: '03',
    title: 'You get the lead context',
    body: 'A text arrives in 60 seconds with name, number, urgency, and transcript so you can close fast.',
    icon: MessageSquareText,
  },
]

const WHY_BADGES = [
  {
    title: 'Observable',
    body: 'Every interaction is logged with call recordings, transcripts, and lead metadata in one dashboard.',
    icon: Eye,
  },
  {
    title: 'Explainable',
    body: 'Know exactly what was said and why the lead was qualified with transparent conversation history.',
    icon: FileText,
  },
  {
    title: 'Scalable',
    body: 'Handle nights, weekends, and call spikes without adding headcount or paying per-minute fees.',
    icon: TrendingUp,
  },
]

const TESTIMONIALS = [
  {
    name: 'Luis Ramirez',
    role: 'Owner, Ramirez Plumbing',
    quote: 'We recovered weekend leads I never even knew we were missing.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Andre Watts',
    role: 'Ops Lead, Westshore HVAC',
    quote: 'Our missed-call leak is basically gone. The speed-to-call-back is unreal.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Natalie Park',
    role: 'Dispatcher, Pacific Electric',
    quote: 'It sounds like us, not a robotic menu. Customers actually stay on the line.',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Chris Nolan',
    role: 'Owner, Canyon Roofing',
    quote: 'After-hours calls now convert instead of disappearing into voicemail.',
    image:
      'https://images.unsplash.com/photo-1541535881962-3bb380b08458?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Erika Gomez',
    role: 'Manager, Bayview Drains',
    quote: 'The transcript + urgency summary tells us who to call first.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=720&q=80',
  },
  {
    name: 'Mark Jensen',
    role: 'Owner, Jensen Mechanical',
    quote: 'One booked emergency job covered the subscription instantly.',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=720&q=80',
  },
]

const PRICING_FEATURES = [
  'Unlimited calls — no per-minute fees',
  'Dedicated AI phone number',
  'Instant SMS alerts — every call',
  'Full recordings and transcripts',
  'Lead dashboard on your phone',
  'Custom greeting for your trade',
  '24/7 coverage',
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="landing-grid-overlay" />

      <NavBar />

      <section
        className="relative min-h-screen flex items-end lg:items-center pt-24 pb-20"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <div className="landing-blob landing-blob-a" />
        <div className="landing-blob landing-blob-b" />
        <div className="landing-blob landing-blob-c" />

        <div className="relative z-10 max-w-5xl w-full">
          <ScrollReveal>
            <div className="section-label mb-6">AI receptionist for contractors</div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <h1
              className="font-display font-bold leading-[0.88] tracking-tight"
              style={{ fontSize: 'var(--text-display-xl)', letterSpacing: '-0.04em' }}
            >
              Every missed call
              <br />
              <span className="gradient-text">is handled before it leaks revenue.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.16}>
            <p
              className="max-w-2xl mt-7"
              style={{ fontSize: 'clamp(18px, 2.1vw, 22px)', color: 'var(--color-text-secondary)' }}
            >
              NeverMiss answers instantly, qualifies the job, and texts your team the full lead context in 60
              seconds.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.24}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-10">
              <Link href="/signup" className="cta-primary">
                Start free trial <span aria-hidden>→</span>
              </Link>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                14 days free · No card required
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 max-w-4xl">
              <div className="feature-card py-6 px-6">
                <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Avg leak
                </div>
                <div className="font-display mt-2" style={{ fontSize: 'clamp(34px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
                  <CounterStat end={130000} prefix="$" duration={2200} className="gradient-text" />
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  per year from one missed call/day
                </div>
              </div>

              <div className="feature-card py-6 px-6">
                <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Capture speed
                </div>
                <div className="font-display mt-2" style={{ fontSize: 'clamp(34px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
                  <span className="gradient-text">60s</span>
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  alert with name, need, urgency
                </div>
              </div>

              <div className="feature-card py-6 px-6 sm:col-span-2 lg:col-span-1">
                <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Coverage
                </div>
                <div className="font-display mt-2" style={{ fontSize: 'clamp(34px, 4vw, 48px)', letterSpacing: '-0.03em' }}>
                  <span className="gradient-text">24/7</span>
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  nights, weekends, and call spikes
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.34}>
            <div className="flex flex-wrap gap-3 mt-10">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="trust-badge">
                  <Activity size={14} style={{ color: 'var(--color-accent)' }} />
                  {badge}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section
        className="py-12 lg:py-16"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
          borderTop: '1px solid var(--color-border-subtle)',
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 100%)',
        }}
      >
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.14em] text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Trusted by contractors in San Diego
          </p>
        </ScrollReveal>

        <StaggerContainer
          className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto"
          staggerDelay={0.08}
          delayChildren={0.1}
        >
          {LOGOS.map((logo) => (
            <StaggerItem key={logo}>
              <div
                className="rounded-lg h-16 flex items-center justify-center text-center px-3"
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  color: 'rgba(245,245,245,0.5)',
                  background: 'rgba(255,255,255,0.01)',
                  filter: 'grayscale(100%)',
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                }}
              >
                {logo}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <div className="max-w-2xl lg:max-w-5xl">
          <ScrollReveal>
            <div className="section-label mb-10">The math</div>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal delay={0.05}>
              <div
                className="font-display font-bold leading-tight"
                style={{
                  fontSize: 'var(--text-display-l)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                }}
              >
                One missed call per day.
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div
                className="font-display font-bold leading-tight"
                style={{
                  fontSize: 'var(--text-display-l)',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '-0.03em',
                }}
              >
                Average job: $500.
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div
                className="font-display font-bold leading-tight"
                style={{
                  fontSize: 'var(--text-display-l)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.03em',
                }}
              >
                That&apos;s <CounterStat end={130000} prefix="$" duration={2200} className="gradient-text" /> a year
                walking out the door.
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.22}>
              <div
                className="font-display leading-tight pt-2"
                style={{
                  fontSize: 'var(--text-display-m)',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '-0.03em',
                }}
              >
                NeverMiss costs $250/month. <span style={{ color: 'var(--color-accent)' }}>One job pays for the year.</span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <ScrollReveal>
          <div className="section-label mb-12">How it works</div>
        </ScrollReveal>

        <StaggerContainer
          className="max-w-6xl space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8"
          staggerDelay={0.12}
          delayChildren={0.12}
        >
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <StaggerItem key={step.n}>
                <div className="feature-card h-full p-8 lg:p-9">
                  <div className="flex items-center justify-between mb-5">
                    <div className="step-number !text-[72px] !opacity-25 !leading-none">{step.n}</div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(30,239,176,0.12)', border: '1px solid rgba(30,239,176,0.22)' }}
                    >
                      <Icon size={18} style={{ color: 'var(--color-accent)' }} />
                    </div>
                  </div>

                  <h3 className="font-display font-semibold mb-3" style={{ fontSize: 'var(--text-h3)' }}>
                    {step.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {step.body}
                  </p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </section>

      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <ScrollReveal>
          <div className="section-label mb-12">Why NeverMiss</div>
        </ScrollReveal>

        <StaggerContainer
          className="grid md:grid-cols-3 gap-6 max-w-6xl"
          staggerDelay={0.1}
          delayChildren={0.1}
        >
          {WHY_BADGES.map((badge) => {
            const Icon = badge.icon
            return (
              <StaggerItem key={badge.title}>
                <div
                  className="rounded-2xl p-8 h-full"
                  style={{
                    border: '1px solid var(--color-border-subtle)',
                    background:
                      'linear-gradient(165deg, rgba(30,239,176,0.06) 0%, rgba(14,168,255,0.04) 40%, rgba(255,255,255,0.01) 100%)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(14,168,255,0.12)', border: '1px solid rgba(14,168,255,0.22)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--color-accent-blue)' }} />
                  </div>
                  <h3 className="font-display text-2xl mb-3 tracking-tight">{badge.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{badge.body}</p>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </section>

      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <ScrollReveal>
          <div className="section-label mb-10">Before &amp; after</div>
        </ScrollReveal>

        <div
          className="grid md:grid-cols-2 max-w-3xl lg:max-w-6xl rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-subtle)' }}
        >
          <StaggerContainer
            className="p-8 md:p-12 lg:p-14"
            style={{ borderRight: '1px solid var(--color-border-subtle)' }}
            staggerDelay={0.07}
            delayChildren={0.1}
          >
            <StaggerItem>
              <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--color-text-muted)' }}>
                Without NeverMiss
              </p>
            </StaggerItem>
            {[
              "Phone rings while you're on the job",
              'Call goes to voicemail',
              'Caller hangs up',
              'They call the next contractor',
              'You discover it too late',
              'Revenue lost',
            ].map((item, i) => (
              <StaggerItem key={item}>
                <div
                  className="py-2.5 text-sm leading-relaxed"
                  style={{ color: i === 5 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}
                >
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <StaggerContainer
            className="p-8 md:p-12 lg:p-14"
            style={{ background: 'var(--color-bg-surface)' }}
            staggerDelay={0.07}
            delayChildren={0.2}
          >
            <StaggerItem>
              <p className="text-xs tracking-widest uppercase mb-8" style={{ color: 'var(--color-accent)' }}>
                With NeverMiss
              </p>
            </StaggerItem>
            {[
              "Phone rings while you're on the job",
              'NeverMiss answers instantly',
              'Lead qualified in real time',
              'Text alert arrives in 60 seconds',
              "You call back with context when you're free",
              'Job won',
            ].map((item, i) => (
              <StaggerItem key={item}>
                <div
                  className="py-2.5 text-sm leading-relaxed flex items-center gap-2"
                  style={{ color: i === 5 ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: i === 5 ? 'var(--color-accent)' : 'rgba(30,239,176,0.7)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <div className="max-w-6xl">
          <ScrollReveal>
            <div className="section-label mb-12">Contractors using NeverMiss</div>
          </ScrollReveal>

          <StaggerContainer
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            staggerDelay={0.09}
            delayChildren={0.1}
          >
            {TESTIMONIALS.map((person) => (
              <StaggerItem key={person.name}>
                <article
                  className="rounded-2xl overflow-hidden h-full"
                  style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}
                >
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-full h-56 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="p-5">
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      “{person.quote}”
                    </p>
                    <p className="font-semibold leading-tight">{person.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {person.role}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <div className="max-w-md lg:max-w-lg lg:mx-auto">
          <ScrollReveal>
            <div className="section-label mb-10">Pricing</div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="stat-card">
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="font-display font-bold"
                  style={{
                    fontSize: 'clamp(56px, 8vw, 72px)',
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  $250
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>/month</span>
              </div>

              <p className="mb-10" style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                14-day free trial. No card required to start.
              </p>

              <ul className="space-y-4 mb-10 text-left">
                {PRICING_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="mt-1 flex-shrink-0" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="cta-primary w-full justify-center">
                Start free trial <span aria-hidden>→</span>
              </Link>

              <p className="text-center text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
                Cancel anytime
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer
        className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
          borderTop: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-muted)',
        }}
      >
        <span className="font-display font-semibold tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>
          NeverMiss
        </span>
        <span>© {new Date().getFullYear()} NeverMiss AI</span>
        <div className="flex gap-6">
          <Link href="/login" className="transition-colors hover:text-white" style={{ color: 'var(--color-text-muted)' }}>
            Sign in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-white" style={{ color: 'var(--color-text-muted)' }}>
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  )
}
