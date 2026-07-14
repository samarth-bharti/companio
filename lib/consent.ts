// lib/consent.ts
//
// Analytics consent state (DPDP / GDPR). Until the visitor decides, consent is
// 'unset' and NO analytics fire. The banner writes 'granted' | 'denied'; other
// modules subscribe via onConsentChange so they can react without a full reload.
//
// Why a CustomEvent and not a React context: consent is read from non-React
// code (lib/analytics.ts) and from the injected gtag snippet, so a plain
// window-level event is the lowest-common-denominator that reaches all of them.

export type ConsentState = 'granted' | 'denied' | 'unset';

const KEY = 'companio_analytics_consent';
export const CONSENT_EVENT = 'companio:consent';

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unset';
  const v = window.localStorage.getItem(KEY);
  return v === 'granted' || v === 'denied' ? v : 'unset';
}

/** gtag is injected by components/analytics/GoogleAnalytics.tsx when GA_ID is set. */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function setConsent(v: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, v);

  // Push the decision into Google Consent Mode HERE, not at the call site.
  //
  // The banner used to do this itself, and only on 'granted'. That was fine while
  // the banner was the only thing that could set consent — but the moment a second
  // caller existed (the opt-out switch in the dashboard), withdrawing consent wrote
  // 'denied' to localStorage while gtag happily carried on with analytics_storage
  // still granted. An opt-out that does not reach the tag is not an opt-out.
  window.gtag?.('consent', 'update', {
    analytics_storage: v,
    // Never granted: Companio does not run ads and does not sell data. The
    // consent banner offers analytics, so analytics is all it can turn on.
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

export function onConsentChange(cb: (v: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb(getConsent());
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
