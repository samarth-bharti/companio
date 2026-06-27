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

export function setConsent(v: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, v);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

export function onConsentChange(cb: (v: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb(getConsent());
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
