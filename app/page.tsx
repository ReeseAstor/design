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
        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl lg:flex lg:items-center lg:gap-14">
            {firstAcquisition ? (
              <div className="mx-auto mb-10 w-[58%] max-w-[260px] lg:mx-0 lg:mb-0 lg:w-[300px] lg:shrink-0">
                <BookCover
                  book={firstAcquisition}
                  format={findFormat(firstAcquisition, 'ebook')}
                  priority
                  sizes="(max-width: 640px) 58vw, 300px"
                />
              </div>
            ) : null}

            <div className="lg:flex-1">
              <p className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
                {MAGNET_EYEBROW}
              </p>
              <h1 className="mt-6 text-balance font-display text-[length:var(--text-hook)] leading-[1.12]">
                {FIRST_ACQUISITION_TITLE}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-ivory/85">
                {MAGNET_HOOK}
              </p>
              <p className="mt-4 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-ink-muted">
                {MAGNET_PROMISE}
              </p>

              <div className="mt-8">
                <FreeBookMagnet variant="hero" />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="series-heading" className="border-t border-line px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 id="series-heading" className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
              Hudson Dynasty
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-ivory/85">
              Four books about a family that treats affection like an acquisition — and the people
              who refuse the terms. Start free with Book 0.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
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
                    <p className="mt-3 font-display text-[1.05rem] leading-snug text-ivory group-hover:text-gold-bright">
                      {book.title}
                    </p>
                    <p className="text-[0.75rem] uppercase tracking-[0.18em] text-ink-muted">
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
              className="tap-target mt-8 inline-flex items-center text-gold underline underline-offset-4 hover:text-gold-bright"
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
