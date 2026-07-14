"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Compass, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Seal } from "@/components/ui/Seal";
import { NavUser } from "@/components/layout/NavUser";
import { dataClient } from "@/lib/dataClient";
import { useData } from "@/lib/useData";
import { useViewerReady } from "@/lib/useViewerReady";
import { cn } from "@/lib/utils";

interface NavProps {
  heroMode?: boolean;
}

const NAV_LINKS = [
  { href: "/explore",      label: "Explore" },
  { href: "/how-it-works", label: "How it works" },
  // Feed + Lounge hidden for now (social layer parked) — re-add when ready.
];
// Safety moved out of the main feature links into a small standalone button
// in the right cluster (see below) + the footer — kept accessible, not crowding
// the primary nav.

// Fixed tabs + 1 dynamic You/Sign-in tab. Feed + Lounge hidden for now.
const TABS = [
  { href: "/",        label: "Home",    Icon: Home },
  { href: "/explore", label: "Explore", Icon: Compass },
];

export function Nav({ heroMode = false }: NavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Hydration-safe: the read is deferred to mount, so the server and the first
  // client render agree. useData also re-reads when the user signs in or out in
  // this tab or any other, which the old [pathname] effect only caught on a
  // navigation.
  // Nav is in the root layout, so this read runs on every public page. In http
  // mode a guest has no session and /api/user answers 401 — skip it.
  const viewerReady = useViewerReady();
  const { data: user } = useData('user', () => dataClient.getUser(), null, viewerReady);
  const signedIn = user !== null;

  useEffect(() => {
    if (!heroMode) return;
    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroMode]);

  const transparent = heroMode && !scrolled;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          transparent
            ? "bg-transparent border-b border-transparent shadow-none"
            : "border-b"
        )}
        style={
          transparent
            ? { borderBottomColor: "transparent" }
            : {
                // Near-opaque solid + light blur — much cheaper to composite
                // while scrolling than the previous blur(16px).
                background: "rgba(251,252,255,0.96)",
                backdropFilter: "blur(6px)",
                borderBottomColor: "rgba(46,107,255,0.12)",
                boxShadow: "var(--shadow-1)",
              }
        }
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-sm focus-visible:outline-azure"
            aria-label="Companio home"
          >
            <Seal size={32} decorative />
            <span className="font-display text-xl font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Companio
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-8 flex-1 justify-center"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-sans font-semibold transition-colors rounded-sm focus-visible:outline-azure",
                  pathname === href ? "text-azure" : "text-ink-muted hover:text-ink"
                )}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
            <Link
              href="/safety"
              aria-label="Safety center"
              aria-current={pathname === "/safety" ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-sans font-semibold transition-colors focus-visible:outline-azure",
                pathname === "/safety" ? "text-azure" : "text-ink-muted hover:text-ink"
              )}
              style={{ border: "1px solid rgba(46,107,255,0.18)" }}
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Safe
            </Link>
            <NavUser />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: "rgba(251,252,255,0.97)",
          backdropFilter: "blur(6px)",
          borderTopColor: "rgba(20,26,46,0.1)",
          boxShadow: "0 -2px 12px rgba(20,26,46,0.08)",
        }}
      >
        <div className="flex">
          {[...TABS,
            // Safety must stay reachable on mobile too — it's core to this product.
            { href: "/safety", label: "Safety", Icon: ShieldCheck },
            signedIn
            ? { href: "/dashboard", label: "You", Icon: LayoutDashboard }
            : { href: "/login", label: "Sign in", Icon: User },
          ].map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1",
                  "py-3 min-h-[56px] text-xs font-sans font-semibold transition-colors",
                  "focus-visible:outline-azure"
                )}
                style={{ color: active ? "var(--color-azure)" : "var(--color-ink-muted)" }}
              >
                <Icon size={22} strokeWidth={active ? 2 : 1.5} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
