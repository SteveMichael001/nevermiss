import type { CSSProperties } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/landing/NavBar'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/landing/ScrollReveal'
import { CounterStat } from '@/components/landing/CounterStat'

// ─────────────────────────────────────────────────────────────
// Trust badges row
// ─────────────────────────────────────────────────────────────
const TRUST_BADGES = [
  '24/7 Coverage',
  '60-Sec Alerts',
  'No Per-Min Fees',
  'Full Transcripts',
]

// ─────────────────────────────────────────────────────────────
// How it works steps
// ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'You miss a call.',
    body: "You're on the job. Hands dirty. Can't pick up. The phone rings anyway.",
  },
  {
    n: '02',
    title: 'NeverMiss answers.',
    body: "Your AI picks up instantly. Speaks your business name. Gets their name, number, and what they need.",
  },
  {
    n: '03',
    title: 'You get a text.',
    body: 'Within 60 seconds: caller name, number, job type, urgency. Tap to call back. Job won.',
  },
]

// ─────────────────────────────────────────────────────────────
// Pricing features
// ─────────────────────────────────────────────────────────────
const PRICING_FEATURES = [
  'Unlimited calls — no per-minute fees',
  'Dedicated AI phone number',
  'Instant SMS alerts — every call',
  'Full recordings and transcripts',
  'Lead dashboard on your phone',
  'Custom greeting for your trade',
  '24/7 coverage',
]

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      {/* Nav */}
      <NavBar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col justify-end lg:justify-center pt-24 pb-20 lg:pb-0 overflow-hidden"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        {/* Hero glow backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--glow-hero)' }}
        />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Decorative ghost stat (top-right) */}
        <div
          className="absolute bottom-16 right-6 md:right-10 lg:right-20 text-right pointer-events-none select-none hidden sm:block"
          style={{ opacity: 0.07 }}
        >
          <div
            className="font-display leading-none tracking-tight"
            style={{
              fontSize: 'clamp(80px, 12vw, 160px)',
              color: 'var(--color-accent)',
            }}
          >
            $130K
          </div>
          <div
            className="text-xs tracking-widest uppercase mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            missed per year
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-3xl lg:max-w-4xl">
          <ScrollReveal delay={0}>
            <div className="section-label mb-6">AI voicemail for contractors</div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1
              className="font-display font-bold leading-[0.95] tracking-tight mb-8"
              style={{
                fontSize: 'var(--text-display-xl)',
                letterSpacing: '-0.03em',
              }}
            >
              That call just went
              <br />
              <span className="gradient-text">to your competitor.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p
              className="leading-relaxed mb-10 max-w-md"
              style={{
                fontSize: 'var(--text-body-lg)',
                color: 'var(--color-text-secondary)',
              }}
            >
              NeverMiss answers every call you can&apos;t.
              <br />
              Captures the lead. Texts you in 60 seconds.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Link href="/signup" className="cta-primary">
                Start free trial <span aria-hidden>→</span>
              </Link>
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                14 days free · No card required
              </span>
            </div>
          </ScrollReveal>

          {/* Trust badges */}
          <ScrollReveal delay={0.45}>
            <div className="flex flex-wrap gap-3 mt-10">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="trust-badge">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {badge}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── The Math ───────────────────────────────────────── */}
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

          <div className="space-y-8">
            <ScrollReveal delay={0.05}>
              <div
                className="font-display font-bold leading-tight"
                style={{
                  fontSize: 'var(--text-display-l)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
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
                  letterSpacing: '-0.02em',
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
                  letterSpacing: '-0.02em',
                }}
              >
                That&apos;s{' '}
                <CounterStat
                  end={130000}
                  prefix="$"
                  duration={2200}
                  className="gradient-text"
                />{' '}
                a year
                <br />
                walking out the door.
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <div
                className="font-display leading-tight pt-4"
                style={{
                  fontSize: 'var(--text-display-m)',
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '-0.02em',
                }}
              >
                NeverMiss costs $250/month.
                <br />
                <span style={{ color: 'var(--color-accent)' }}>
                  One job pays for the year.
                </span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── How It Works ───────────────────────────────────── */}
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
          className="max-w-2xl lg:max-w-5xl space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-10"
          staggerDelay={0.12}
          delayChildren={0.1}
        >
          {STEPS.map((step) => (
            <StaggerItem key={step.n}>
              <div className="feature-card h-full">
                <div className="step-number mb-4">{step.n}</div>
                <h3
                  className="font-display font-semibold mb-3"
                  style={{
                    fontSize: 'var(--text-h3)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {step.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Section divider */}
      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── Without / With ─────────────────────────────────── */}
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
          className="grid md:grid-cols-2 max-w-3xl lg:max-w-5xl rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-subtle)' }}
        >
          {/* Without */}
          <StaggerContainer
            className="p-8 md:p-12 lg:p-14"
            style={{ borderRight: '1px solid var(--color-border-subtle)' } as CSSProperties}
            staggerDelay={0.07}
            delayChildren={0.1}
          >
            <StaggerItem>
              <p
                className="text-xs tracking-widest uppercase mb-8"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Without NeverMiss
              </p>
            </StaggerItem>
            {[
              "Phone rings while you're on the job",
              'Call goes to voicemail',
              'Caller hangs up',
              'They call the next plumber',
              'You find out two days later',
              '— or never',
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div
                  className="py-2 text-sm leading-relaxed"
                  style={{
                    color: i === 5 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  }}
                >
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* With */}
          <StaggerContainer
            className="p-8 md:p-12 lg:p-14"
            style={{ background: 'var(--color-bg-surface)' } as CSSProperties}
            staggerDelay={0.07}
            delayChildren={0.3}
          >
            <StaggerItem>
              <p
                className="text-xs tracking-widest uppercase mb-8"
                style={{ color: 'var(--color-accent)' }}
              >
                With NeverMiss
              </p>
            </StaggerItem>
            {[
              "Phone rings while you're on the job",
              'NeverMiss answers instantly',
              'Lead captured in 60 seconds',
              'You get a text with everything',
              "You call back when you're free",
              '— job won',
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div
                  className="py-2 text-sm leading-relaxed flex items-center gap-2"
                  style={{
                    color: i === 5 ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  }}
                >
                  {i < 5 && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'var(--color-accent)',
                        display: 'inline-block',
                        flexShrink: 0,
                        opacity: 0.7,
                      }}
                    />
                  )}
                  {item}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── Social proof ───────────────────────────────────── */}
      <section
        className="py-24 lg:py-32"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
        }}
      >
        <div className="max-w-2xl lg:max-w-4xl lg:mx-auto text-center">
          <ScrollReveal>
            <blockquote
              className="font-display font-medium leading-snug mb-8"
              style={{
                fontSize: 'var(--text-display-m)',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              &ldquo;I used to lose 3 or 4 calls a week and not even know it.
              First month with NeverMiss, I picked up{' '}
              <span className="gradient-text">6 jobs I would&apos;ve missed.</span>&rdquo;
            </blockquote>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Mike T. — HVAC contractor, San Diego
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── Pricing ────────────────────────────────────────── */}
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
              {/* Price */}
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
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  /month
                </span>
              </div>

              <p
                className="mb-10"
                style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}
              >
                14-day free trial. No card required to start.
              </p>

              <ul className="space-y-4 mb-10 text-left">
                {PRICING_FEATURES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <span
                      className="mt-1 flex-shrink-0"
                      style={{ color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="cta-primary w-full justify-center">
                Start free trial <span aria-hidden>→</span>
              </Link>

              <p
                className="text-center text-xs mt-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Cancel anytime
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        style={{
          paddingLeft: 'var(--container-padding)',
          paddingRight: 'var(--container-padding)',
          borderTop: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-muted)',
        }}
      >
        <span
          className="font-display font-semibold tracking-tight"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          NeverMiss
        </span>
        <span>© {new Date().getFullYear()} NeverMiss AI</span>
        <div className="flex gap-6">
          <Link
            href="/login"
            className="transition-colors hover:text-white"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="transition-colors hover:text-white"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  )
}


