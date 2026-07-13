import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { ClipReveal } from '@/components/journey/ClipReveal';
import { WaveBridge } from '@/components/journey/WaveBridge';

export interface InfoSection {
  heading: string;
  body: string[];
  id?: string; // optional anchor target, e.g. "spin" → /terms#spin
}

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoSection[];
  /** Replaces the default footnote — e.g. a page-specific "last updated" date. */
  footnote?: string;
  /** Rendered after the sections. Used by /contact for its form. */
  children?: React.ReactNode;
}

/** Shared layout for legal / policy / trust pages — calm, readable, real text. */
export function InfoPage({ eyebrow, title, intro, sections, footnote, children }: InfoPageProps) {
  return (
    <>
      <Nav />
      <BackBar fallbackHref="/" />
      <main
        id="main-content"
        className="flex-1 pb-24 md:pb-12"
        style={{ background: 'var(--color-bg)' }}
      >
        {/* Aurora header band — a radial azure tint at low opacity. */}
        <div
          className="relative overflow-hidden pt-16 md:pt-20"
          style={{
            background:
              'radial-gradient(ellipse 90% 120% at 50% -10%, rgba(46,107,255,0.07) 0%, transparent 65%)',
          }}
        >
          {/* Header content */}
          <div className="relative max-w-3xl mx-auto px-6 pb-12" style={{ zIndex: 1 }}>
            <RevealGroup>
              <Reveal delay={0}>
                <p className="label-eyebrow mb-4" style={{ color: 'var(--color-azure)' }}>
                  {eyebrow}
                </p>
              </Reveal>
              <ClipReveal
                as="h1"
                text={title}
                className="font-display text-h1 leading-tight tracking-tight mb-5"
                style={{ color: 'var(--color-ink)' }}
              />
              <Reveal delay={0.16}>
                <p className="text-lead mb-2 max-w-2xl" style={{ color: 'var(--color-ink-muted)' }}>
                  {intro}
                </p>
              </Reveal>
            </RevealGroup>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-3xl mx-auto px-6 pt-4">
          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <Reveal key={s.heading} delay={i * 0.06}>
                <section id={s.id} className="scroll-mt-24">
                  <h2
                    className="font-display text-h3 tracking-tight mb-3"
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {s.heading}
                  </h2>
                  {s.body.map((p, j) => (
                    <p
                      key={j}
                      className="font-sans text-base leading-relaxed mb-3"
                      style={{ color: 'var(--color-ink-muted)' }}
                    >
                      {p}
                    </p>
                  ))}
                </section>
              </Reveal>
            ))}
          </div>

          {children && <div className="mt-12">{children}</div>}

          {/* The default footnote used to end with "This is a product
              demonstration; policies shown are illustrative." It was printed at
              the bottom of the Terms of Service and the Privacy Policy — the two
              documents whose entire value is that they are not illustrative. A
              policy that disclaims itself binds nobody, and tells a user their
              DPDPA rights are a mock-up. */}
          <p className="font-sans text-xs mt-16 mb-8" style={{ color: 'rgba(20,26,46,0.4)' }}>
            {footnote ?? `Last updated July 2026 · ${'TRYCOMPANIOLABS LLP'}`}
          </p>
        </div>
      </main>
      {/* Seam from page bg → footer dark panel */}
      <WaveBridge
        fill="var(--color-ink-dark-panel)"
        base="var(--color-bg)"
        height={72}
      />
      <Footer />
    </>
  );
}
