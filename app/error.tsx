'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    import('@sentry/nextjs')
      .then((s) => s.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <>
      <Nav />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <section
          className="min-h-[75vh] flex items-center justify-center py-24 px-6"
          style={{ background: 'var(--grad-hero-bg)' }}
          aria-labelledby="error-heading"
        >
          <div className="max-w-md text-center">
            <span
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ background: 'var(--color-azure-tint)', color: 'var(--color-azure)' }}
              aria-hidden="true"
            >
              <AlertTriangle size={32} strokeWidth={1.5} />
            </span>

            <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
              Something went wrong
            </p>
            <h1
              id="error-heading"
              className="font-display text-h1 leading-tight tracking-tight mb-5"
              style={{ color: 'var(--color-ink)' }}
            >
              Something went off-script.
            </h1>
            <p className="text-lead mb-10" style={{ color: 'var(--color-ink-muted)' }}>
              A small hiccup on our end — nothing you did. Your connections and
              bookings are safe. Give it another go or head back home.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button variant="cta" size="lg" onClick={reset}>
                Try again
              </Button>
              <Link
                href="/"
                className="inline-flex items-center h-12 px-6 rounded-pill font-sans font-semibold text-sm transition-colors hover:underline underline-offset-4"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                ← Back to home
              </Link>
            </div>

            {error.digest && (
              <p
                className="mt-10 text-xs font-mono"
                style={{ color: 'var(--color-ink-muted)', opacity: 0.45 }}
              >
                Error ref: {error.digest}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
