import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { LoginForm } from '@/components/auth/LoginForm';
import { safeRedirect } from '@/lib/safeRedirect';

export const metadata: Metadata = {
  title: 'Sign In, Companio',
  description:
    'Sign in to your Companio account to browse ID-checked companions and manage your bookings.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeRedirect(rawNext); // guard against open-redirect

  return (
    <>
      <Nav />
      <BackBar fallbackHref="/" />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <section
          className="min-h-[80vh] flex items-center justify-center py-24 px-6"
          aria-labelledby="login-heading"
          style={{ background: 'var(--grad-hero-bg)' }}
        >
          <div className="w-full max-w-md">
            <div
              className="rounded-3xl p-8 md:p-10"
              style={{
                background:  'var(--color-surface)',
                boxShadow:   'var(--shadow-lift)',
                border:      '1px solid rgba(46,107,255,0.12)',
              }}
            >
              <LoginForm next={next} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
