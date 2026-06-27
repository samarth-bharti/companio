import type { Metadata } from 'next';
import { Nav } from '@/components/layout/Nav';
import { BackBar } from '@/components/layout/BackBar';
import { Footer } from '@/components/layout/Footer';
import { RegisterWizard } from '@/components/auth/RegisterWizard';
import { safeRedirect } from '@/lib/safeRedirect';

export const metadata: Metadata = {
  title: 'Create Account, Companio',
  description:
    'Join Companio and connect with ID-verified companions for platonic activities across India.',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; as?: string; gate?: string }>;
}) {
  const { next: rawNext, as, gate } = await searchParams;
  const next = safeRedirect(rawNext); // guard against open-redirect
  const presetRole = as === 'companion' ? 'companion' : as === 'member' ? 'member' : undefined;

  return (
    <>
      <Nav />
      <BackBar fallbackHref="/" />
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <section
          className="min-h-[80vh] flex items-center justify-center py-24 px-6"
          aria-label="Create your Companio account"
          style={{ background: 'var(--grad-hero-bg)' }}
        >
          <RegisterWizard next={next} presetRole={presetRole} gate={gate} />
        </section>
      </main>
      <Footer />
    </>
  );
}
