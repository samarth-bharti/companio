export const metadata = {
  title: "Design System, Companio (internal)",
  robots: { index: false, follow: false },
};

import { Nav } from "@/components/layout/Nav";
import { Button } from "@/components/ui/Button";
import { PassportCard } from "@/components/ui/PassportCard";
import { PassportStack } from "@/components/ui/PassportStack";
import { Seal } from "@/components/ui/Seal";
import { TicketStub } from "@/components/ui/TicketStub";
import { PassportPhoto } from "@/components/ui/PassportPhoto";
import { MapPin, Clock, Star } from "lucide-react";

const SWATCHES = [
  { name: "Paper", hex: "#F2EBDD", cls: "bg-paper", dark: false },
  { name: "Surface", hex: "#FBF7EE", cls: "bg-surface", dark: false },
  { name: "Oat", hex: "#EDE3D2", cls: "bg-oat", dark: false },
  { name: "Edge", hex: "#DCCDB6", cls: "bg-edge", dark: false },
  { name: "Ink", hex: "#1C2433", cls: "bg-ink", dark: true },
  { name: "Ink Muted", hex: "#5C5648", cls: "bg-ink-muted", dark: true },
  { name: "Navy", hex: "#243A5E", cls: "bg-navy", dark: true },
  { name: "Navy Strong", hex: "#1A2C47", cls: "bg-navy-strong", dark: true },
  { name: "Brass", hex: "#B0892F", cls: "bg-brass", dark: true },
  { name: "Brass Ink", hex: "#6D5214 (adj)", cls: "bg-brass-ink", dark: true },
  { name: "Trust", hex: "#3F7A4B", cls: "bg-trust", dark: true },
  { name: "Trust Wash", hex: "#E6F0E9", cls: "bg-trust-wash", dark: false },
  { name: "Marigold", hex: "#E8A33D", cls: "bg-marigold", dark: false },
  { name: "Seal Gradient", hex: "135° #6E4FA3→#D9568B", cls: "", dark: true },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 border-b border-edge last:border-none">
      <p className="label-eyebrow text-ink-muted mb-6">{title}</p>
      {children}
    </section>
  );
}

export default function Styleguide() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 pb-24 md:pb-10">
        <div className="pt-12 pb-8 border-b border-edge mb-2">
          <p className="label-eyebrow text-brass-ink mb-2">Internal</p>
          <h1 className="font-display text-h1 text-ink leading-tight tracking-tight">
            Design System
          </h1>
          <p className="text-lead text-ink-muted mt-3">
            Passport · Ledger · Trust, the visual language.
          </p>
        </div>

        {/* ── Palette ── */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SWATCHES.map(({ name, hex, cls, dark }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div
                  className={`h-14 rounded-md border border-edge ${cls} flex items-end p-2`}
                  style={
                    name === "Seal Gradient"
                      ? { background: "var(--grad-seal)" }
                      : undefined
                  }
                >
                  <span
                    className={`label-eyebrow ${dark ? "text-white/80" : "text-ink/60"}`}
                  >
                    {name}
                  </span>
                </div>
                <span className="text-xs text-ink-muted font-mono">{hex}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Type Scale ── */}
        <Section title="Type Scale">
          <div className="space-y-5">
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">Display, Fraunces</p>
              <p className="font-display text-display text-ink leading-none tracking-tight">
                Trusted.
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">H1, Fraunces</p>
              <p className="font-display text-h1 text-ink leading-tight">
                Find your companion
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">H2, Fraunces</p>
              <p className="font-display text-h2 text-ink">Verified members only</p>
            </div>
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">H3, Plus Jakarta</p>
              <p className="font-sans text-h3 font-semibold text-ink">
                City guiding · Events · Gym
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">Lead, Plus Jakarta</p>
              <p className="font-sans text-lead text-ink-muted">
                Book ID-verified companions for any activity, strictly platonic.
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">
                Member Statement, Lora (serif)
              </p>
              <p className="font-serif text-base text-ink italic leading-relaxed">
                &ldquo;The best evening I&apos;ve had exploring a new city. Priya was
                brilliant company, knowledgeable, kind, completely professional.&rdquo;
              </p>
            </div>
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" size="md">Find a companion</Button>
            <Button variant="secondary" size="md">Learn more</Button>
            <Button variant="ghost" size="md">Sign in</Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center mt-4">
            <Button variant="primary" size="sm">Primary sm</Button>
            <Button variant="secondary" size="sm">Secondary sm</Button>
            <Button variant="ghost" size="sm">Ghost sm</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
        </Section>

        {/* ── PassportCard ── */}
        <Section title="Passport Card">
          <div className="grid sm:grid-cols-2 gap-6">
            <PassportCard className="p-6">
              <div className="flex items-start gap-4">
                <PassportPhoto name="Priya Sharma" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-h3 text-ink leading-tight">
                    Priya Sharma
                  </p>
                  <p className="text-sm text-ink-muted mt-1">
                    City Guide · Mumbai
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star
                      size={14}
                      fill="var(--color-marigold)"
                      stroke="none"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-ink">4.9</span>
                    <span className="text-sm text-ink-muted">(124)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" /> Bandra, Colaba, Fort
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} aria-hidden="true" /> From ₹800/hr
                </span>
              </div>
            </PassportCard>
            <PassportCard className="p-6" elevated>
              <p className="label-eyebrow text-brass-ink mb-2">Elevated state</p>
              <p className="text-ink-muted text-sm">
                Cards lift to shadow-2 depth on hover, or can be set elevated
                for already-selected / featured items.
              </p>
            </PassportCard>
          </div>
        </Section>

        {/* ── Trust Signals ── */}
        <Section title="Trust Signals, PassportStack">
          <PassportStack />
        </Section>

        {/* ── Seal ── */}
        <Section title="Wax Seal">
          <div className="flex flex-wrap gap-8 items-center">
            <div className="flex flex-col items-center gap-2">
              <Seal size={56} label="Companio seal" />
              <span className="text-xs text-ink-muted">56px default</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Seal size={80} label="Companio seal large" />
              <span className="text-xs text-ink-muted">80px large</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Seal size={32} decorative />
              <span className="text-xs text-ink-muted">32px nav</span>
            </div>
          </div>
        </Section>

        {/* ── Ticket Stub ── */}
        <Section title="Ticket Stub">
          <div className="max-w-md">
            <TicketStub
              stub={
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="label-eyebrow text-navy text-[0.6rem]">
                    Booking
                  </span>
                  <span className="font-display text-navy text-lg font-semibold">
                    #4821
                  </span>
                </div>
              }
            >
              <p className="label-eyebrow text-brass-ink mb-1">Confirmed</p>
              <p className="font-display text-h3 text-ink">City Walk · Colaba</p>
              <p className="text-sm text-ink-muted mt-1">
                Sat 14 Jun · 10:00-13:00 · with Priya S.
              </p>
              <p className="text-sm text-ink mt-2 font-semibold">₹2,400</p>
            </TicketStub>
          </div>
        </Section>

        {/* ── Passport Photos ── */}
        <Section title="Passport Photo">
          <div className="flex flex-wrap gap-8 items-end">
            <div className="flex flex-col items-center gap-2">
              <PassportPhoto name="Priya Sharma" size="lg" />
              <span className="text-xs text-ink-muted">With image (lg)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PassportPhoto name="Rahul Mehra" size="md" />
              <span className="text-xs text-ink-muted">Initials fallback (md)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PassportPhoto name="Ananya Singh" size="sm" />
              <span className="text-xs text-ink-muted">Initials fallback (sm)</span>
            </div>
          </div>
        </Section>
      </main>
    </>
  );
}
