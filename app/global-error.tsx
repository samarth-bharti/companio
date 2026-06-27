'use client';

/**
 * global-error.tsx — root error boundary.
 *
 * Replaces the entire document when the root layout itself fails, so it MUST
 * render its own <html><body>. Globals.css is not guaranteed to be loaded here,
 * so every style is inlined. Token values are copied verbatim from globals.css
 * so the page looks on-brand even without the stylesheet.
 */

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    import('@sentry/nextjs')
      .then((s) => s.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#FBFCFF',        /* --color-bg */
          color: '#141A2E',             /* --color-ink */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          {/* Icon badge */}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '1rem',
              background: '#EBF1FF',    /* --color-azure-tint */
              color: '#2E6BFF',         /* --color-azure */
              fontSize: '1.6rem',
              marginBottom: '1.5rem',
            }}
          >
            ✦
          </span>

          {/* Eyebrow */}
          <p
            style={{
              margin: '0 0 0.75rem',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2E6BFF',         /* --color-azure */
            }}
          >
            Companio — critical error
          </p>

          {/* Heading */}
          <h1
            style={{
              margin: '0 0 1rem',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#141A2E',         /* --color-ink */
            }}
          >
            Something went off-script.
          </h1>

          {/* Body */}
          <p
            style={{
              margin: '0 0 2.5rem',
              fontSize: '1.1rem',
              lineHeight: 1.65,
              color: '#5A6378',         /* --color-ink-muted */
            }}
          >
            Our app hit a bump before it could load fully. No data was lost
            — please try again and we&apos;ll be right back with you.
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                height: '3rem',
                padding: '0 2rem',
                borderRadius: '999px',
                border: 'none',
                /* --grad-cta */
                background: 'linear-gradient(135deg, #1B2236 0%, #11162A 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                /* --glow-azure */
                boxShadow:
                  '0 0 0 1px rgba(20,26,46,0.06), 0 14px 38px -16px rgba(20,26,46,0.45)',
              }}
            >
              Try again
            </button>
            {/* global-error replaces the whole document on a root crash, so a
                full-page navigation (plain <a>) is correct here, not next/link. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: '3rem',
                padding: '0 1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#5A6378',       /* --color-ink-muted */
                textDecoration: 'none',
              }}
            >
              ← Back to home
            </a>
          </div>

          {/* Debug digest — hidden from users with low opacity */}
          {error.digest && (
            <p
              style={{
                marginTop: '2.5rem',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: '#5A6378',
                opacity: 0.45,
              }}
            >
              Error ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
