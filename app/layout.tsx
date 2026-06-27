import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Lora } from "next/font/google";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { MotionPreferenceProvider } from "@/lib/motionPreference";
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

const TITLE = "Companio, Trusted. Verified. Companionship.";
const DESCRIPTION =
  "Book ID-verified companions for city guiding, events, gym, conversation, and more. Strictly platonic. Indian market.";

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
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
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
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {/* Skip link — sighted keyboard users can jump past the nav. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-sans focus:font-semibold focus:text-sm focus:bg-[var(--color-azure)] focus:text-white focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <MotionPreferenceProvider>
          <LenisProvider>{children}</LenisProvider>
        </MotionPreferenceProvider>
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
