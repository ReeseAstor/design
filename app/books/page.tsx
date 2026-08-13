import Link from 'next/link';
import type { Metadata } from 'next';
import { BookCover } from '@/components/conversion/BookCover';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { findFormat } from '@/lib/amazon/destination';
import { getAllBooks } from '@/lib/content/source';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';

export const metadata: Metadata = {
  title: 'All Books | Reese Astor',
  description:
    'Every Reese Astor contemporary billionaire romance: the Hudson Dynasty and Manhattan Money Kings series.',
  alternates: { canonical: '/books' },
};

export default async function BooksPage() {
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
          <h1 className="font-display text-[length:var(--text-display)] leading-[1.02]">Books</h1>

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
                          : `/books/${book.slug}`
                      }
                      className="group block"
                    >
                      {/* Catalog covers stay lazy — only the active hero cover is preloaded. */}
                      <BookCover
                        book={book}
                        format={findFormat(book, 'ebook')}
                        sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 220px"
                      />
                      <p className="mt-3 font-display text-[1.05rem] leading-snug text-ivory group-hover:text-gold-bright">
                        {book.title}
                      </p>
                      <p className="text-[0.75rem] uppercase tracking-[0.18em] text-ink-muted">
                        {book.publicationStatus === 'prelaunch' ? 'Coming soon' : `Book ${book.seriesOrder}`}
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
