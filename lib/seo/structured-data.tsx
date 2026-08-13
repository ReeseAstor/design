import { absoluteUrl } from '@/lib/config';
import type { Book, BookFormatRecord } from '@/lib/content/types';

/**
 * Book and BreadcrumbList JSON-LD.
 *
 * `aggregateRating` and `review` are deliberately absent. Schema.org rating
 * markup is a factual claim to search engines, and no verified rating exists for
 * Golden Parachute — emitting one would be a structured-data lie, quite apart
 * from being a rich-results policy violation.
 */

export function bookJsonLd(book: Book, format: BookFormatRecord | null, canonicalPath: string) {
  const url = absoluteUrl(canonicalPath);
  const image = format?.coverAsset?.url ?? undefined;

  const offers =
    format && format.priceUsd !== null && format.amazonProductUrl
      ? {
          '@type': 'Offer',
          price: format.priceUsd.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: format.amazonProductUrl,
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url,
    ...(image ? { image } : {}),
    author: {
      '@type': 'Person',
      name: book.author,
      url: absoluteUrl('/'),
    },
    ...(book.series
      ? {
          isPartOf: {
            '@type': 'BookSeries',
            name: book.series,
            url: absoluteUrl('/hudson-dynasty'),
          },
        }
      : {}),
    ...(book.seriesOrder !== null ? { position: book.seriesOrder } : {}),
    bookFormat: 'https://schema.org/EBook',
    inLanguage: 'en-US',
    genre: book.genre ?? undefined,
    ...(format?.asin ? { isbn: undefined, identifier: format.asin } : {}),
    description: book.longBlurb[0] ?? book.shortHook ?? undefined,
    ...(offers ? { offers } : {}),
    contentRating: 'Adult',
  };
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Renders JSON-LD without dangerously-set HTML parsing surprises. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for the one sequence that can break out
      // of a script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
