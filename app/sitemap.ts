import type { MetadataRoute } from 'next';
import { getAllBooks } from '@/lib/content/source';
import { absoluteUrl } from '@/lib/config';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';

/**
 * Organic and series pages only.
 *
 * /gp/*, /go/*, /api/* and /studio/* are excluded by construction — nothing in
 * this file can produce them. Campaign URLs are noindex, and listing them would
 * hand search engines a set of duplicate pages to sort out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getAllBooks();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: absoluteUrl('/golden-parachute'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/hudson-dynasty'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: absoluteUrl('/books'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/cookies'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const bookRoutes: MetadataRoute.Sitemap = books
    .filter((book) => book.slug !== GOLDEN_PARACHUTE_SLUG && book.publicationStatus === 'live')
    .map((book) => ({
      url: absoluteUrl(`/books/${book.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...bookRoutes];
}
