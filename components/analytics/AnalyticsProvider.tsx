'use client';

// AnalyticsProvider — mounts the analytics sinks (GA4, Web Vitals) and turns
// every client-side route change into a pageview. Because it reads
// useSearchParams it MUST be wrapped in <Suspense> at the mount site
// (app/layout.tsx) or Next forces the whole tree to be dynamic.

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GoogleAnalytics } from './GoogleAnalytics';
import { WebVitals } from './WebVitals';
import { pageview } from '@/lib/analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    pageview(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return (
    <>
      <GoogleAnalytics />
      <WebVitals />
    </>
  );
}
