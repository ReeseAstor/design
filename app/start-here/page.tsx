import type { Metadata } from 'next';
import Link from 'next/link';
import { BookCover } from '@/components/conversion/BookCover';
import { FreeBookMagnet } from '@/components/site/FreeBookMagnet';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { findFormat } from '@/lib/amazon/destination';
import {
  FIRST_ACQUISITION_SLUG,
  FIRST_ACQUISITION_TITLE,
  MAGNET_EYEBROW,
  MAGNET_HOOK,
  MAGNET_PROMISE,
  READING_ORDER,
} from '@/lib/content/magnet';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';
import { getBookBySlug, getHudsonDynastyBooks } from '@/lib/content/source';
import { NewsletterSignup } from '@/components/site/NewsletterSignup';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Start Here — Free Book & Reading Order',
  description:
    'New to Reese Astor? Claim The First Acquisition free on BookFunnel, then read the Hudson Dynasty in order.',
  alternates: { canonical: '/start-here' },
};

export default async function StartHerePage() {
  const [firstAcquisition, hudson] = await Promise.all([
    getBookBySlug(FIRST_ACQUISITION_SLUG),
    getHudsonDynastyBooks(),
  ]);
  const bySlug = new Map(hudson.map((book) => [book.slug, book]));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Reese Astor', path: '/' },
          { name: 'Start Here', path: '/start-here' },
        ])}
      />
      <SiteHeader />

      <main id="main">
        <section className="bg-canvas px-5 py-12 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
            {firstAcquisition ? (
              <div className="mx-auto w-[52%] max-w-[240px] lg:mx-0 lg:w-[260px] lg:shrink-0">
                <BookCover
                  book={firstAcquisition}
                  format={findFormat(firstAcquisition, 'ebook')}
                  priority
                  sizes="(max-width: 640px) 52vw, 260px"
                />
              </div>
            ) : null}

            <div className="lg:flex-1">
              <p className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink">
                {MAGNET_EYEBROW}
              </p>
              <h1 className="mt-5 text-balance font-display text-[length:var(--text-display)] leading-[0.95] text-ink">
                Start with {FIRST_ACQUISITION_TITLE}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-[1rem] leading-[1.25] text-ink">
                {MAGNET_HOOK}
              </p>
              <p className="mt-3 max-w-xl text-pretty text-[1rem] leading-[1.25] text-quiet">
                {MAGNET_PROMISE}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <FreeBookMagnet variant="hero" directClaim />
              </div>
              <p className="mt-3 font-sans text-[0.75rem] text-quiet">
                Free instant download · Delivered by BookFunnel
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="reading-order-heading"
          className="border-t border-ink bg-paper px-5 py-12 sm:px-8"
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="reading-order-heading"
              className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink"
            >
              Hudson Dynasty reading order
            </h2>
            <p className="mt-5 max-w-2xl text-[1rem] leading-[1.25] text-ink">
              Every Hudson book stands alone with its own happily-ever-after. Start free with Book
              0, then continue in order.
            </p>

            <ol className="mt-10 divide-y divide-ink border-t border-ink">
              {READING_ORDER.map((entry) => {
                const book = bySlug.get(entry.slug);
                const ebook = book ? findFormat(book, 'ebook') : null;
                const href =
                  entry.slug === FIRST_ACQUISITION_SLUG
                    ? '/start-here'
                    : entry.slug === GOLDEN_PARACHUTE_SLUG
                      ? '/golden-parachute'
                      : `/books/${entry.slug}`;

                return (
                  <li key={entry.slug} className="flex gap-5 py-8 sm:gap-8">
                    {book ? (
                      <div className="w-20 shrink-0 sm:w-28">
                        <BookCover book={book} format={ebook} sizes="112px" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[0.75rem] uppercase tracking-[0.14em] text-quiet">
                        Book {entry.seriesOrder}
                        {entry.free ? ' · Free' : ''}
                      </p>
                      <h3 className="mt-2 font-display text-[1.375rem] leading-[0.95] text-ink">
                        {entry.title}
                      </h3>
                      <p className="mt-2 text-[0.9375rem] leading-[1.25] text-quiet">{entry.note}</p>
                      {entry.free ? (
                        <div className="mt-4">
                          <FreeBookMagnet variant="inline" directClaim />
                        </div>
                      ) : (
                        <Link
                          href={href}
                          className="tap-target mt-3 inline-flex items-center border-b border-gold text-ink no-underline hover:border-ink"
                        >
                          More about {entry.title}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <NewsletterSignup
          headline="Want new-release alerts?"
          body="Join the reader list for Hudson Dynasty news, bonus scenes, and launch notes. No spam — unsubscribe any time."
          bookInterest="the_first_acquisition"
          offerId="start_here_magnet"
          sourceUrl="/start-here"
        />
      </main>

      <SiteFooter />
    </>
  );
}
