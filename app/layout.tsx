import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Lora } from "next/font/google";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { MotionPreferenceProvider } from "@/lib/motionPreference";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, orgJsonLd, websiteJsonLd, jsonLd } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"], // optical-size axis: richer serifs at display scale
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

// Say the concrete thing first: someone arriving cold from search or a shared
// link must know what they can actually do here before they read any poetry.
//
// This used to read "book a verified companion". The `verified` column is
// operator-owned and false for every companion on the platform, and this is the
// <title> and the search-result snippet — the very first promise Companio makes
// to a stranger, made before they have read a single line of the site.
// Starts the hero poster downloading during head parse, so the hero can paint
// real footage without waiting for React to hydrate and mount the <video>.
//
// The poster alone, not the mp4: measured on throttled 4G, preloading the video
// too moved its completion by ~300 ms (inside the noise) while making the whole
// 1.3 MB liable to be fetched twice by any browser that declines to match the
// preload against the media element's range request. The poster is what the
// visitor actually sees, and it is 33 KB.
//
// It re-tests, in plain JS, the three conditions useHeroVideoEnabled() tests in
// PhoneJourneyHero: reduced motion, Data Saver, and 2G/3G. Change one and change
// the other, or this fetches a poster for a hero that renders no video. The
// homepage check matters for the same reason — the hero exists on "/" alone.
//
// Failures are swallowed: navigator.connection is absent on Safari and Firefox,
// and a hero that preloads nothing is merely slow, whereas a head script that
// throws takes the page down with it.
const HERO_PRELOAD = `(function(){try{
if(location.pathname!=='/')return;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var c=navigator.connection;
if(c&&(c.saveData||/(^|-)2g$|3g/.test(c.effectiveType||'')))return;
var l=document.createElement('link');
l.rel='preload';l.as='image';l.href='/hero-poster.webp';
l.type='image/webp';l.fetchPriority='high';
document.head.appendChild(l);
}catch(e){}})();`;

const TITLE = "Companio, book a companion for the things you'd rather not do alone.";
const DESCRIPTION =
  "Book an ID-checked companion for a city walk, café chat or gym session. Strictly platonic. A pass from ₹199 unlocks every profile in your city, first meeting included.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Companio",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Companio",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Companio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, overlay tools, …)
    // inject attributes onto <html>/<body> before React hydrates, causing a
    // spurious attribute mismatch. This only ignores diffs on these two elements
    // (one level deep) — real mismatches inside the app still surface.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plusJakarta.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        {/* Start the hero footage downloading while the HTML is still parsing.
            Must run here, not from the hero component: that component is a client
            component whose video is gated on an effect, so left to itself the
            request cannot begin until the JS bundle has downloaded, parsed and
            hydrated — which is the whole reason the hero used to appear late. */}
        <script dangerouslySetInnerHTML={{ __html: HERO_PRELOAD }} />
        {/* Warm up the Spline origin so the desktop bento 3D iframe connects faster. */}
        <link rel="preconnect" href="https://my.spline.design" />
        {/* Structured data — helps search engines understand the brand + site. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(orgJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd()) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {/* Skip link — sighted keyboard users can jump past the nav. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-sans focus:font-semibold focus:text-sm focus:bg-[var(--color-azure)] focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <AuthProvider>
          <MotionPreferenceProvider>
            <LenisProvider>{children}</LenisProvider>
          </MotionPreferenceProvider>
        </AuthProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
        <PostHogProvider />
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
