'use client';

// GoogleAnalytics — loads GA4 (gtag.js) behind NEXT_PUBLIC_GA_ID with Google
// Consent Mode v2. Renders nothing if the id is unset, so the app ships with
// analytics fully wired but dormant until you paste the measurement id.
//
// Consent Mode: we default every storage type to 'denied' so gtag loads but
// stores nothing until the consent banner calls gtag('consent','update', ...).
// page_view is sent manually from AnalyticsProvider (send_page_view: false)
// so SPA navigations are tracked, not just the first load.

import Script from 'next/script';
import { GA_ID } from '@/lib/analytics';

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        id="ga-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
          });
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
