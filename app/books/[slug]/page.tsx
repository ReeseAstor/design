import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BookCover } from '@/components/conversion/BookCover';
import { BuyButton } from '@/components/conversion/BuyButton';
import { StickyBuyBar, STICKY_BAR_CLEARANCE } from '@/components/conversion/StickyBuyBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { findFormat } from '@/lib/amazon/destination';
import { getAllBooks, getBookBySlug } from '@/lib/content/source';
import { formatPrice } from '@/lib/conversion/view-model';
import { ORGANIC_CAMPAIGN_ID } from '@/lib/campaigns/registry';
import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';
import { bookJsonLd, breadcrumbJsonLd, JsonLd } from '@/lib/seo/structured-data';

/**
 * Catalog book page. Golden Parachute redirects to its dedicated conversion page
 * so there is exactly one URL competing for that title in search.
 */

export async function generateStaticParams() {
  const books = await getAllBooks();
  return books
    .filter((book) => book.slug !== GOLDEN_PARACHUTE_SLUG)
    .map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};

  const description =
    book.longBlurb[0] ??
    book.shortHook?.replace('\n', ' ') ??
    `${book.title} — ${book.genre ?? 'contemporary romance'} by ${book.author}.`;

  return {
    title: `${book.title} | Reese Astor`,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      type: 'book',
      title: book.title,
      description,
      images: findFormat(book, 'ebook')?.coverAsset?.url
        ? [{ url: findFormat(book, 'ebook')!.coverAsset!.url! }]
        : undefined,
    },
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === GOLDEN_PARACHUTE_SLUG) redirect('/golden-parachute');

  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const purchasable = book.formats.filter(
    (format) => format.active && Boolean(format.amazonProductUrl),
  );

  // The Kindle edition is what the sticky bar sells; the other formats stay in
  // the list where a reader who wants them will look.
  const stickyFormat = purchasable.find((format) => format.format === 'ebook') ?? null;

  return (
    <>
      <JsonLd data={bookJsonLd(book, findFormat(book, 'ebook'), `/books/${book.slug}`)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Reese Astor', path: '/' },
          { name: 'Books', path: '/books' },
          { name: book.title, path: `/books/${book.slug}` },
        ])}
      />
      <SiteHeader />

      <main
        id="main"
        className="px-5 py-12 sm:px-8"
        style={{ paddingBottom: stickyFormat ? STICKY_BAR_CLEARANCE : undefined }}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-9 lg:flex-row lg:gap-14">
          <div className="mx-auto w-[58%] max-w-[260px] lg:mx-0 lg:w-[300px] lg:shrink-0">
            <BookCover
              book={book}
              format={findFormat(book, 'ebook')}
              priority
              sizes="(max-width: 640px) 58vw, 300px"
            />
          </div>

          <div className="lg:flex-1">
            {book.series ? (
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-gold">
                {book.series} · Book {book.seriesOrder}
              </p>
            ) : null}
            <h1 className="mt-3 font-display text-[length:var(--text-section)] leading-tight">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{book.author}</p>

            {book.longBlurb.length > 0 ? (
              <div className="mt-6 space-y-4">
                {book.longBlurb.map((paragraph, index) => (
                  <p key={index} className="text-pretty leading-relaxed text-ivory/85">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-8 space-y-5">
              {purchasable.map((format) => (
                <div key={format.format} className="sm:max-w-sm">
                  <BuyButton
                    bookSlug={book.slug}
                    bookTitle={book.title}
                    campaignId={ORGANIC_CAMPAIGN_ID}
                    placement="hero"
                    variant="control"
                    experimentKey={null}
                    trafficSource="organic"
                    format={format.format}
                    intent={book.seriesOrder === 0 ? 'book0' : 'primary'}
                    tone={format.format === 'ebook' ? 'gold' : 'outline'}
                    label={
                      formatPrice(format.priceUsd)
                        ? `${labelFor(format.format)} — ${formatPrice(format.priceUsd)}`
                        : labelFor(format.format)
                    }
                    supportingLine={
                      format.kuEnabled ? 'Also available with Kindle Unlimited' : undefined
                    }
                  />
                </div>
              ))}

              {purchasable.length === 0 ? (
                <p className="rounded-sm border border-gold/40 bg-graphite/60 p-5 text-[0.95rem] text-ivory/85">
                  This title is not on sale yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />

      {stickyFormat ? (
        <StickyBuyBar
          bookSlug={book.slug}
          bookTitle={book.title}
          campaignId={ORGANIC_CAMPAIGN_ID}
          variant="control"
          experimentKey={null}
          trafficSource="organic"
          format={stickyFormat.format}
          priceUsd={stickyFormat.priceUsd}
          kuEnabled={stickyFormat.kuEnabled}
          intent={book.seriesOrder === 0 ? 'book0' : 'primary'}
        />
      ) : null}
    </>
  );
}

function labelFor(format: string): string {
  if (format === 'ebook') return 'Read the Kindle edition';
  if (format === 'audiobook') return 'Listen on Audible';
  return 'Buy the paperback';
}
