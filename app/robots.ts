import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Campaign pages already send noindex; disallowing them here keeps paid
        // landing URLs out of crawl budget entirely.
        disallow: ['/gp/', '/go/', '/api/', '/studio/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
