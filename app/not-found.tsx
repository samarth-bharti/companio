import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <section
          className="min-h-[75vh] flex items-center justify-center py-24 px-6"
          style={{ background: "var(--grad-hero-bg)" }}
          aria-labelledby="notfound-heading"
        >
          <div className="max-w-md text-center">
            <span
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ background: "var(--color-azure-tint)", color: "var(--color-azure)" }}
              aria-hidden="true"
            >
              <Compass size={32} strokeWidth={1.5} />
            </span>

            <p className="label-eyebrow mb-3" style={{ color: "var(--color-azure)" }}>
              Page not found
            </p>
            <h1
              id="notfound-heading"
              className="font-display text-h1 leading-tight tracking-tight mb-5"
              style={{ color: "var(--color-ink)" }}
            >
              We couldn&apos;t find that page.
            </h1>
            <p className="text-lead mb-10" style={{ color: "var(--color-ink-muted)" }}>
              The link may be broken or the page may have moved. Let&apos;s get you back on track, verified companions are waiting.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center h-12 px-8 rounded-pill font-sans font-bold text-sm text-white transition-all hover:opacity-90 focus-visible:outline-white"
                style={{ background: "var(--grad-cta)", boxShadow: "var(--glow-azure)" }}
              >
                Browse companions
              </Link>
              <Link
                href="/"
                className="inline-flex items-center h-12 px-6 rounded-pill font-sans font-semibold text-sm transition-colors hover:underline underline-offset-4"
                style={{ color: "var(--color-ink-muted)" }}
              >
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
