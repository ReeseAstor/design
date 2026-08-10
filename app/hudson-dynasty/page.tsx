import Link from 'next/link';
import type { Metadata } from 'next';
import { BookCover } from '@/components/conversion/BookCover';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { findFormat } from '@/lib/amazon/destination';
import { getHudsonDynastyBooks } from '@/lib/content/source';
import { formatPrice } from '@/lib/conversion/view-model';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/structured-data';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';

export const metadata: Metadata = {
  title: 'Hudson Dynasty — Reading Order | Reese Astor',
  description:
    'The Hudson Dynasty series in order: The First Acquisition, Hostile Tender, Poison Pill, and Golden Parachute. Contemporary billionaire romance by Reese Astor.',
  alternates: { canonical: '/hudson-dynasty' },
  robots: { index: true, follow: true },
};

/**
 * Read-through page. Its purpose is series completion, so it leads with reading
 * order and links each book to its own page rather than straight to Amazon —
 * the tracked purchase links live on the book pages where the offer is made.
 */
export default async function HudsonDynastyPage() {
  const books = await getHudsonDynastyBooks();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Reese Astor', path: '/' },
          { name: 'Hudson Dynasty', path: '/hudson-dynasty' },
        ])}
      />
      <SiteHeader />

      <main id="main">
        <section className="px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
              The series, in order
            </p>
            <h1 className="mt-6 text-balance font-display text-[length:var(--text-display)] leading-[1.02]">
              Hudson Dynasty
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-[1.05rem] leading-relaxed text-ivory/85">
              Every Hudson book stands alone with its own happily-ever-after. Read in order and the
              family debts compound — which is exactly what happens to Kai in Golden Parachute.
            </p>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8">
          <ol className="mx-auto max-w-4xl space-y-10">
            {books.map((book) => {
              const ebook = findFormat(book, 'ebook');
              const price = formatPrice(ebook?.priceUsd ?? null);
              const isCurrent = book.slug === GOLDEN_PARACHUTE_SLUG;

              return (
                <li key={book.slug} className="flex gap-5 sm:gap-8">
                  <div className="w-24 shrink-0 sm:w-32">
                    <BookCover
                      book={book}
                      format={ebook}
                      sizes="(max-width: 640px) 96px, 128px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-gold">
                      Book {book.seriesOrder}
                      {isCurrent ? ' · New' : ''}
                    </p>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-ivory">
                      {book.title}
                    </h2>
                    {book.shortHook ? (
                      <p className="mt-2 text-pretty text-[0.95rem] leading-relaxed text-ivory/80">
                        {book.shortHook.split('\n')[0]}
                      </p>
                    ) : null}

                    <p className="mt-3 text-[0.85rem] text-ink-muted">
                      {book.publicationStatus === 'prelaunch'
                        ? 'Coming soon'
                        : [price, ebook?.kuEnabled ? 'Kindle Unlimited' : null]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>

                    <Link
                      href={isCurrent ? '/golden-parachute' : `/books/${book.slug}`}
                      className="tap-target mt-3 inline-flex items-center text-gold underline underline-offset-4 hover:text-gold-bright"
                    >
                      {isCurrent ? 'See Golden Parachute' : `More about ${book.title}`}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
