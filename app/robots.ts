import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        // The operator console. It redirects non-admins and now sends
        // `noindex, nofollow`, but neither of those stops a crawler asking for
        // the URL in the first place, and the paths themselves ("/admin/payouts",
        // "/admin/users") are worth keeping out of any public index.
        '/admin',
        '/dashboard',
        '/companion-dashboard',
        '/book',
        // Sign-in and sign-up are dead ends for a crawler and duplicate no content.
        '/login',
        '/register',
        '/quiz',
        '/styleguide',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
