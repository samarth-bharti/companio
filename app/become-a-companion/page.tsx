import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { BadgeCheck, Clock, Wallet, Shield } from "lucide-react";
import type { Metadata } from "next";
import { EarningsCalculator } from "@/components/companion/EarningsCalculator";
import { ApplySteps } from "@/components/companion/ApplySteps";
import { VerificationTimeline } from "@/components/companion/VerificationTimeline";

export const metadata: Metadata = {
  title: "Become a Companion, Companio",
  description: "Join Companio as a ID-checked companion. Set your own schedule, earn on your terms, and meet interesting people across India.",
};

const BENEFITS = [
  {
    icon: Clock,
    title: "Your schedule, your pace",
    body: "Accept bookings when it suits you. No minimums, no pressure. Full-time or weekend gigs, you decide.",
    color: "#2E6BFF",
    bg: "#EBF1FF",
  },
  {
    icon: Wallet,
    title: "Transparent earnings",
    body: "Set your own rate. Payments are released to you directly after each completed session via Razorpay.",
    color: "#7A4FE0",
    bg: "#F0EBFF",
  },
  {
    icon: BadgeCheck,
    title: "Verified & respected",
    body: "ID verification signals trust to members. Your profile badge and reviews build a reputation that travels.",
    color: "#1FAE6B",
    bg: "#E6F5EE",
  },
  {
    icon: Shield,
    title: "Safety first, always",
    body: "In-app SOS, ID-checked members, and a dedicated trust team make every booking safe for companions and members alike.",
    color: "#FFB23E",
    bg: "#FFF8EC",
  },
] as const;

export default function BecomeACompanionPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className="relative py-24 md:py-32 overflow-hidden"
          style={{ background: "var(--grad-dark-panel)" }}
          aria-labelledby="bac-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
            style={{ background: "var(--color-violet)" }}
          />
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <p className="label-eyebrow mb-4" style={{ color: "var(--color-gold)" }}>
              Join as a companion
            </p>
            <h1
              id="bac-heading"
              className="font-display text-h1 leading-tight tracking-tight mb-6"
              style={{ color: "var(--color-panel-text)" }}
            >
              Turn your social energy into{" "}
              <em className="not-italic" style={{ background: "var(--grad-aurora)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                meaningful income.
              </em>
            </h1>
            <p className="text-lead mb-10" style={{ color: "rgba(244,242,255,0.62)" }}>
              Meet interesting people, guide them through your city, and get paid fairly, all on your own schedule. Strictly platonic, always professional.
            </p>
            <Link
              href="/become-a-companion/apply"
              className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-sans font-bold text-lg text-white transition-all hover:opacity-90 focus-visible:outline-white"
              style={{ background: "var(--grad-cta)", boxShadow: "var(--glow-azure)" }}
            >
              Apply to become a companion
            </Link>
          </div>
        </section>

        {/* ── Benefits ──────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28" style={{ background: "var(--color-bg)" }} aria-labelledby="benefits-heading">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="label-eyebrow mb-4" style={{ color: "var(--color-azure)" }}>Why companions choose us</p>
              <h2 id="benefits-heading" className="font-display text-h2 leading-tight tracking-tight" style={{ color: "var(--color-ink)" }}>
                Built for companions, not just members.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mb-14">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex flex-col rounded-2xl p-7" style={{ background: b.bg, border: `1.5px solid ${b.color}22` }}>
                    <span className="flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{ background: `${b.color}18` }} aria-hidden="true">
                      <Icon size={22} strokeWidth={1.8} style={{ color: b.color }} />
                    </span>
                    <h3 className="font-sans font-bold text-h3 mb-3 leading-snug" style={{ color: "var(--color-ink)" }}>{b.title}</h3>
                    <p className="font-sans text-base leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>{b.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Earnings calculator ──────────────────────────────────────── */}
        <section className="py-20" style={{ background: "var(--color-azure-tint)" }} aria-labelledby="calc-heading">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="label-eyebrow mb-3" style={{ color: "var(--color-azure)" }}>Earning potential</p>
              <h2 id="calc-heading" className="font-display text-h2 leading-tight tracking-tight" style={{ color: "var(--color-ink)" }}>
                See what you could earn
              </h2>
            </div>
            <EarningsCalculator />
          </div>
        </section>

        {/* ── How it works — 4-step stepper ───────────────────────────── */}
        <section className="py-20 md:py-28" style={{ background: "var(--color-bg)" }} aria-labelledby="how-heading">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="label-eyebrow mb-3" style={{ color: "var(--color-azure)" }}>Getting started</p>
              <h2 id="how-heading" className="font-display text-h2 leading-tight tracking-tight" style={{ color: "var(--color-ink)" }}>
                From application to first booking
              </h2>
            </div>
            <ApplySteps />
          </div>
        </section>

        {/* ── Verification timeline ─────────────────────────────────────── */}
        <section className="py-20 md:py-28" style={{ background: "var(--grad-dark-panel)" }} aria-labelledby="verify-heading">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="label-eyebrow mb-3" style={{ color: "var(--color-gold)" }}>Verification</p>
              <h2 id="verify-heading" className="font-display text-h2 leading-tight tracking-tight mb-3" style={{ color: "var(--color-panel-text)" }}>
                Safe for everyone
              </h2>
              <p className="font-sans text-base" style={{ color: "rgba(244,242,255,0.62)" }}>
                Warm, professional company, with the trust signals that make it real.
              </p>
            </div>
            <div className="rounded-2xl p-6 md:p-8" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <VerificationTimeline />
            </div>
            <div className="text-center mt-10">
              <Link
                href="/become-a-companion/apply"
                className="inline-flex items-center justify-center h-14 px-10 rounded-pill font-sans font-bold text-lg text-white transition-all hover:opacity-90 focus-visible:outline-white"
                style={{ background: "var(--grad-cta)", boxShadow: "var(--glow-azure)" }}
              >
                Apply now, it takes 5 minutes
              </Link>
              <Link href="/" className="block mt-4 font-sans text-sm hover:underline underline-offset-4" style={{ color: "rgba(244,242,255,0.5)" }}>
                ← Back to home
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
