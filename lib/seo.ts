/**
 * The canonical origin of this deployment.
 *
 * Everything public depends on it: canonical tags, `og:url`, the sitemap's every
 * <loc>, and the Sitemap/Host lines in robots.txt. Getting it wrong does not
 * break the app — it quietly points search engines and social previews at a
 * domain that is not ours.
 *
 * Which is exactly what happened: NEXT_PUBLIC_SITE_URL was set to the literal
 * placeholder `https://your-app.vercel.app`, and the deployment happily published
 * a sitemap for a domain nobody owns. The old fallback was no safer — a Vercel
 * build with the variable simply unset advertised `http://localhost:3000`.
 *
 * So: prefer the explicit variable, ignore it when it is obviously a fill-me-in,
 * and otherwise ask the platform. Vercel injects both of these into the client
 * bundle automatically, so a correct value needs no configuration at all:
 *
 *   NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL — the stable production domain
 *   NEXT_PUBLIC_VERCEL_URL                    — this specific deployment
 *
 * A preview build then describes itself, and production describes production.
 * localhost stays the last resort, where it is actually true.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !isPlaceholderOrigin(explicit)) return stripTrailingSlash(explicit);

  const prod = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${stripTrailingSlash(prod).replace(/^https?:\/\//, '')}`;

  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (deployment) return `https://${stripTrailingSlash(deployment).replace(/^https?:\/\//, '')}`;

  return 'http://localhost:3000';
}

/** `your-app.vercel.app`, `example.com`, `<your domain>` — a value nobody meant. */
function isPlaceholderOrigin(v: string): boolean {
  return /your[-_]?app|your[-_]?domain|example\.(com|org)|\[\[|^</i.test(v);
}

function stripTrailingSlash(v: string): string {
  return v.replace(/\/+$/, '');
}

export const SITE_URL = resolveSiteUrl();

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
