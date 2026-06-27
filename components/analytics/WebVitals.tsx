'use client';

// WebVitals — reports Core Web Vitals (LCP, CLS, INP, FCP, TTFB) through the
// central analytics facade. Uses Next's built-in hook (no extra dependency).
// Values are rounded; CLS is sub-1 so we keep 3 decimals for it.

import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics';

export function WebVitals() {
  useReportWebVitals((metric) => {
    const value =
      metric.name === 'CLS'
        ? Math.round(metric.value * 1000) / 1000
        : Math.round(metric.value);
    track('web_vitals', {
      metric: metric.name,
      value,
      rating: metric.rating,
      id: metric.id,
    });
  });
  return null;
}
