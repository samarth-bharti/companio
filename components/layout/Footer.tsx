import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Seal } from "@/components/ui/Seal";
import { COMPANY_DISPLAY } from "@/lib/company";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Find a companion", href: "/explore" },
      { label: "Categories",       href: "/explore#categories" },
      { label: "Cities",           href: "/explore#cities" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "Blog",     href: "/blog" },
      { label: "Careers",  href: "/careers" },
      { label: "Press",    href: "/press" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy",   href: "/privacy" },
      { label: "Refund policy",    href: "/refunds" },
      { label: "Cookie policy",    href: "/cookies" },
    ],
  },
  {
    heading: "Safety",
    links: [
      { label: "Safety centre",      href: "/safety" },
      { label: "Platonic promise",   href: "/safety#promise" },
      { label: "Verify a companion", href: "/verify" },
      { label: "Trust & KYC",        href: "/trust" },
    ],
  },
];

const TRUST_BADGES = [
  { label: "Razorpay secured",    color: "rgba(244,242,255,0.6)", border: "rgba(244,242,255,0.15)" },
  { label: "KYC verified", color: "rgba(244,242,255,0.6)", border: "rgba(244,242,255,0.15)" },
  { label: "Strictly platonic",   color: "var(--color-emerald)",  border: "rgba(31,174,107,0.3)" },
] as const;

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        background: "var(--color-ink-dark-panel)",
        borderTopColor: "rgba(46,107,255,0.2)",
      }}
      role="contentinfo"
    >
      {/* SOS banner */}
      <div
        className="border-b flex items-center justify-center gap-2 py-3 px-6"
        style={{ borderColor: "rgba(31,174,107,0.2)", background: "rgba(31,174,107,0.08)" }}
      >
        <ShieldCheck size={14} style={{ color: "var(--color-emerald)" }} className="shrink-0" aria-hidden="true" />
        <p className="text-xs font-sans text-center" style={{ color: "rgba(244,242,255,0.6)" }}>
          <Link
            href="/safety#sos"
            className="font-bold hover:underline underline-offset-4 focus-visible:outline-white"
            style={{ color: "var(--color-emerald)" }}
          >
            In-app SOS &amp; live-share
          </Link>{" "}
, every booking includes emergency contact sharing.
        </p>
      </div>

      {/* pb-24 on mobile clears the 56px fixed tab bar */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-24 md:pb-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 focus-visible:outline-white rounded-sm"
              aria-label="Companio home"
            >
              <Seal size={32} decorative />
              <span className="font-display text-lg font-semibold" style={{ color: "var(--color-panel-text)" }}>
                Companio
              </span>
            </Link>
            <p className="text-xs font-sans leading-relaxed" style={{ color: "rgba(244,242,255,0.5)" }}>
              Trusted companionship for city walks, events, workouts &amp; more.
              Strictly platonic. Always verified.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="label-eyebrow" style={{ color: "rgba(46,107,255,0.9)" }}>
                {col.heading}
              </p>
              <nav aria-label={col.heading}>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs font-sans transition-colors hover:underline underline-offset-4 focus-visible:outline-white rounded-sm"
                        style={{ color: "rgba(244,242,255,0.70)" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(46,107,255,0.15)" }}
        >
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            {TRUST_BADGES.map(({ label, color, border }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-pill border"
                style={{ color, borderColor: border }}
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-xs font-sans text-center md:text-right" style={{ color: "rgba(244,242,255,0.3)" }}>
            © {new Date().getFullYear()} {COMPANY_DISPLAY.legalName}. All rights reserved.
          </p>
        </div>

        {/* DPDPA / IT Act required disclosures — registered address + Grievance Officer */}
        <div
          className="mt-6 pt-6 border-t text-[11px] leading-relaxed font-sans text-center md:text-left"
          style={{ borderColor: "rgba(46,107,255,0.1)", color: "rgba(244,242,255,0.3)" }}
        >
          <p>
            {COMPANY_DISPLAY.legalName} · {COMPANY_DISPLAY.registeredAddress}
            {COMPANY_DISPLAY.llpin ? ` · LLPIN ${COMPANY_DISPLAY.llpin}` : ""}
          </p>
          <p>
            Grievance Officer: {COMPANY_DISPLAY.grievanceOfficer.name} ·{" "}
            <a
              href={`mailto:${COMPANY_DISPLAY.grievanceOfficer.email}`}
              className="hover:underline underline-offset-4 focus-visible:outline-white"
            >
              {COMPANY_DISPLAY.grievanceOfficer.email}
            </a>
            {COMPANY_DISPLAY.grievanceOfficer.phone ? ` · ${COMPANY_DISPLAY.grievanceOfficer.phone}` : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
