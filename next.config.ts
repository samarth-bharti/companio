import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Companion portraits are the same handful of sources on every visit. A long
    // cache TTL keeps Vercel image transformations (a billed line item) near the
    // free allowance regardless of traffic.
    minimumCacheTTL: 31_536_000,
    formats: ["image/avif", "image/webp"],
  },
};

// Sentry's runtime init lives in instrumentation-client.ts / sentry.*.config.ts,
// but the build-time wrapper is what instruments the server bundle and uploads
// source maps. Source-map upload is skipped without SENTRY_AUTH_TOKEN, so this
// stays a no-op locally and in CI while still working on Vercel once keyed.
export default withSentryConfig(nextConfig, {
  silent: true,
  // Only attempt an upload when a token is actually present.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
