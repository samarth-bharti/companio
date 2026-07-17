import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { COMPANIONS } from '@/lib/data/companions';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    // ── Core ──────────────────────────────────────────────────────────────────
    { url: SITE_URL,                              changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/explore`,                 changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/how-it-works`,            changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/safety`,                  changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/pricing`,                 changeFrequency: 'monthly', priority: 0.8 },
    // ── Companion programme ───────────────────────────────────────────────────
    { url: `${SITE_URL}/become-a-companion`,      changeFrequency: 'monthly', priority: 0.7 },
    // ── Trust & verification ──────────────────────────────────────────────────
    { url: `${SITE_URL}/trust`,                   changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/verify`,                  changeFrequency: 'monthly', priority: 0.6 },
    // ── Company ───────────────────────────────────────────────────────────────
    { url: `${SITE_URL}/about`,                   changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/blog`,                    changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${SITE_URL}/careers`,                 changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/press`,                   changeFrequency: 'monthly', priority: 0.5 },
    // ── Legal ─────────────────────────────────────────────────────────────────
    { url: `${SITE_URL}/terms`,                   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/community-guidelines`,    changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,                 changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/refunds`,                 changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/delivery`,                changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/cookies`,                 changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const companionRoutes: MetadataRoute.Sitemap = COMPANIONS.map((c) => ({
    url: `${SITE_URL}/companion/${c.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...companionRoutes];
}
