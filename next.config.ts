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

  // Files under public/ are served with `max-age=0, must-revalidate` by default,
  // so the hero footage paid for a revalidation round trip on every single page
  // load. Both files are content-stable — the mp4 is only ever replaced by
  // `npm run encode:hero`, which rewrites the poster with it — so they can be
  // cached hard. A replacement needs a new filename to bust this.
  async headers() {
    return [
      {
        source: "/:file(hero\\.mp4|hero-poster\\.webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
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
