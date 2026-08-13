import Link from 'next/link';
import type { Metadata } from 'next';
import { BookCover } from '@/components/conversion/BookCover';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { getAllBooks, getHudsonDynastyBooks } from '@/lib/content/source';
import {
  GOLDEN_PARACHUTE_SLUG,
  GP_BRAND_MESSAGE,
  GP_HOOK_LINE_ONE,
  GP_HOOK_LINE_TWO,
  GP_POSITIONING_LINE,
} from '@/lib/content/golden-parachute';
import { findFormat } from '@/lib/amazon/destination';

export const metadata: Metadata = {
  title: 'Reese Astor — Contemporary Billionaire Romance',
  description:
    'Reese Astor writes contemporary billionaire romance with real emotional stakes. Hudson Dynasty and Manhattan Money Kings.',
  alternates: { canonical: '/' },
};

/**
 * The home page has one job: move a visitor to the Golden Parachute page. It is
 * not a shop window, and it does not compete with the conversion page.
 */
export default async function HomePage() {
  const [books, hudson] = await Promise.all([getAllBooks(), getHudsonDynastyBooks()]);
  const goldenParachute = books.find((book) => book.slug === GOLDEN_PARACHUTE_SLUG) ?? null;

  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl lg:flex lg:items-center lg:gap-14">
            {goldenParachute ? (
              <div className="mx-auto mb-10 w-[58%] max-w-[260px] lg:mx-0 lg:mb-0 lg:w-[300px] lg:shrink-0">
                <BookCover
                  book={goldenParachute}
                  format={findFormat(goldenParachute, 'ebook')}
                  priority
                  sizes="(max-width: 640px) 58vw, 300px"
                />
              </div>
            ) : null}

            <div className="lg:flex-1">
              <p className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
                The new Hudson Dynasty novel
              </p>
              <h1 className="mt-6 text-balance font-display text-[length:var(--text-hook)] leading-[1.12]">
                <span className="block">{GP_HOOK_LINE_ONE}</span>
                <span className="block">{GP_HOOK_LINE_TWO}</span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-ivory/85">
                {GP_POSITIONING_LINE}
              </p>

              <Link
                href="/golden-parachute"
                className="tap-target mt-8 inline-flex items-center justify-center rounded-sm bg-gold px-7 py-4 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright motion-reduce:transition-none"
              >
                Read about Golden Parachute
              </Link>
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
              who refuse the terms.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {hudson.map((book) => (
                <li key={book.slug}>
                  <Link href={`/books/${book.slug}`} className="group block">
                    <BookCover
                      book={book}
                      format={findFormat(book, 'ebook')}
                      sizes="(max-width: 640px) 44vw, 200px"
                    />
                    <p className="mt-3 font-display text-[1.05rem] leading-snug text-ivory group-hover:text-gold-bright">
                      {book.title}
                    </p>
                    <p className="text-[0.75rem] uppercase tracking-[0.18em] text-ink-muted">
                      Book {book.seriesOrder}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/hudson-dynasty"
              className="tap-target mt-8 inline-flex items-center text-gold underline underline-offset-4 hover:text-gold-bright"
            >
              Read the series in order
            </Link>
          </div>
        </section>

        <p className="mx-auto max-w-2xl px-5 py-16 text-center font-display text-[1.35rem] leading-snug text-gold-bright sm:px-8">
          {GP_BRAND_MESSAGE}
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
