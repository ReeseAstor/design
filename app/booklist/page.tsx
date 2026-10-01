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

      <main id="main" className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-[length:var(--text-display)] leading-[1.02]">
            Booklist
          </h1>
          <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-ivory/85">
            Every Reese Astor title in one place. Prefer{' '}
            <Link href="/books" className="text-gold underline underline-offset-4 hover:text-gold-bright">
              /books
            </Link>{' '}
            — same catalog.
          </p>

          {[...bySeries.entries()].map(([series, seriesBooks]) => (
            <section key={series} aria-labelledby={`series-${series}`} className="mt-14">
              <h2
                id={`series-${series}`}
                className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold"
              >
                {series}
              </h2>

              <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
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
                        sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 220px"
                      />
                      <p className="mt-3 font-display text-[1.05rem] leading-snug text-ivory group-hover:text-gold-bright">
                        {book.title}
                      </p>
                      <p className="text-[0.75rem] uppercase tracking-[0.18em] text-ink-muted">
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
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
