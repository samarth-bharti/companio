export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Organization JSON-LD for Companio — strictly platonic, areaServed India. */
export function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Companio',
    url: SITE_URL,
    description:
      'Companio is a trusted, verified platonic companionship marketplace in India — ' +
      'city guides, events, gym partners, and meaningful conversation. ' +
      'Strictly platonic. Always safe.',
    areaServed: 'India',
  };
}

/** BreadcrumbList JSON-LD from an ordered array of { name, url } items. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** WebSite JSON-LD — used once in the root layout. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Companio',
    url: SITE_URL,
  };
}

/**
 * Serialize a JSON-LD object for safe inlining in a <script> tag. Escapes '<'
 * to < so no string value (even an operator-set SITE_URL) can ever break
 * out of the script element with a "</script>" sequence.
 */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
