import Link from 'next/link';
import type { Metadata } from 'next';
import { BookCover } from '@/components/conversion/BookCover';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { findFormat } from '@/lib/amazon/destination';
import { getAllBooks } from '@/lib/content/source';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';
import { FIRST_ACQUISITION_SLUG } from '@/lib/content/magnet';

export const metadata: Metadata = {
  title: 'Booklist | Reese Astor',
  description:
    'Reese Astor booklist: Hudson Dynasty and Manhattan Money Kings contemporary billionaire romance.',
  alternates: { canonical: '/booklist' },
};

/**
 * Catalog alias for /books — same listing, IA-friendly /booklist path.
 */
export default async function BooklistPage() {
  const books = await getAllBooks();
  const bySeries = new Map<string, typeof books>();

  for (const book of books) {
    const key = book.series ?? 'Standalone';
    bySeries.set(key, [...(bySeries.get(key) ?? []), book]);
  }

  return (
    <>
      <SiteHeader />

      <main id="main">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <h1 className="font-display text-[length:var(--text-display)] leading-[0.95] text-ink">
            Booklist
          </h1>
          <p className="mt-4 max-w-2xl text-[1rem] leading-[1.25] text-ink">
            Every Reese Astor title in one place. Prefer{' '}
            <Link href="/books" className="border-b border-gold text-ink no-underline hover:border-ink">
              /books
            </Link>{' '}
            — same catalog.
          </p>
        </div>

        {[...bySeries.entries()].map(([series, seriesBooks], index) => (
          <section
            key={series}
            aria-labelledby={`series-${series}`}
            className={index % 2 === 1 ? 'border-t border-ink bg-paper' : 'border-t border-ink bg-canvas'}
          >
            <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
              <h2
                id={`series-${series}`}
                className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink"
              >
                {series}
              </h2>

              <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {seriesBooks.map((book) => (
                  <li key={book.slug}>
                    <Link
                      href={
                        book.slug === GOLDEN_PARACHUTE_SLUG
                          ? '/golden-parachute'
                          : book.slug === FIRST_ACQUISITION_SLUG
                            ? '/start-here'
                            : `/books/${book.slug}`
                      }
                      className="group block"
                    >
                      <BookCover
                        book={book}
                        format={findFormat(book, 'ebook')}
                        sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 280px"
                      />
                      <p className="mt-3 font-display text-[1.125rem] leading-snug text-ink">
                        {book.title}
                      </p>
                      <p className="mt-1 font-sans text-[0.75rem] uppercase tracking-[0.12em] text-quiet">
                        {book.publicationStatus === 'prelaunch'
                          ? 'Coming soon'
                          : book.slug === FIRST_ACQUISITION_SLUG
                            ? 'Free · Book 0'
                            : `Book ${book.seriesOrder}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </main>

      <SiteFooter />
    </>
  );
}
