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
} from '@/lib/content/magnet';
import { getBookBySlug, getHudsonDynastyBooks } from '@/lib/content/source';

export const metadata: Metadata = {
  title: 'Reese Astor — Contemporary Billionaire Romance',
  description:
    'Claim The First Acquisition free, then read the Hudson Dynasty in order. Contemporary billionaire romance by Reese Astor.',
  alternates: { canonical: '/' },
};

/**
 * Home has one job: move a visitor into the free First Acquisition magnet
 * (Start Here / BookFunnel). Competing purchase CTAs stay off this page.
 */
export default async function HomePage() {
  const [firstAcquisition, hudson] = await Promise.all([
    getBookBySlug(FIRST_ACQUISITION_SLUG),
    getHudsonDynastyBooks(),
  ]);

  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="bg-canvas px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-5xl lg:flex lg:items-end lg:gap-12">
            {firstAcquisition ? (
              <div className="mx-auto mb-8 w-[58%] max-w-[260px] lg:mx-0 lg:mb-0 lg:w-[280px] lg:shrink-0">
                <BookCover
                  book={firstAcquisition}
                  format={findFormat(firstAcquisition, 'ebook')}
                  priority
                  sizes="(max-width: 640px) 58vw, 280px"
                />
              </div>
            ) : null}

            <div className="lg:flex-1 lg:pb-2">
              <p className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink">
                {MAGNET_EYEBROW}
              </p>
              <h1 className="mt-5 text-balance font-display text-[length:var(--text-display)] leading-[0.95] text-ink">
                {FIRST_ACQUISITION_TITLE}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-[1rem] leading-[1.25] text-ink">
                {MAGNET_HOOK}
              </p>
              <p className="mt-3 max-w-xl text-pretty text-[1rem] leading-[1.25] text-quiet">
                {MAGNET_PROMISE}
              </p>

              <div className="mt-8">
                <FreeBookMagnet variant="hero" />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="series-heading" className="border-t border-ink bg-paper px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 id="series-heading" className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink">
              Hudson Dynasty
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] leading-[1.25] text-ink">
              Four books about a family that treats affection like an acquisition — and the people
              who refuse the terms. Start free with Book 0.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {hudson.map((book) => (
                <li key={book.slug}>
                  <Link
                    href={
                      book.slug === FIRST_ACQUISITION_SLUG ? '/start-here' : `/books/${book.slug}`
                    }
                    className="group block"
                  >
                    <BookCover
                      book={book}
                      format={findFormat(book, 'ebook')}
                      sizes="(max-width: 640px) 44vw, 200px"
                    />
                    <p className="mt-3 font-display text-[1.125rem] leading-snug text-ink">
                      {book.title}
                    </p>
                    <p className="mt-1 font-sans text-[0.75rem] uppercase tracking-[0.12em] text-quiet">
                      {book.slug === FIRST_ACQUISITION_SLUG
                        ? 'Free · Book 0'
                        : `Book ${book.seriesOrder}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/start-here"
              className="tap-target mt-8 inline-flex items-center border-b border-gold text-ink no-underline hover:border-ink"
            >
              See the reading order
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
