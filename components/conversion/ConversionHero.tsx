import { BookCover } from './BookCover';
import { BuyButton } from './BuyButton';
import { PrelaunchNotice } from './PrelaunchNotice';
import { TropeTeaser } from './TropeStrip';
import { GP_SERIES_LINE_COMPACT, GP_TROPE_TEASER } from '@/lib/content/golden-parachute';
import { formatPrice, type ConversionViewModel } from '@/lib/conversion/view-model';

/**
 * The first mobile viewport.
 *
 * Order is fixed and non-negotiable: cover, hook, title, series position, trope
 * teaser, price, Kindle Unlimited line, primary CTA, Book 0 alternative. Every
 * one of those lines answers a question the reader is already asking, and the
 * Buy button sits above the fold on a 320px screen.
 */
export function ConversionHero({ model }: { model: ConversionViewModel }) {
  const { book, landingPage } = model;
  const hookLines = landingPage.headline.split('\n').filter(Boolean);
  const price = formatPrice(model.priceUsd);
  const teaserLabels =
    model.landingPage.tropeOrder.length > 0
      ? model.landingPage.tropeOrder.slice(0, 3).map((t) => t.label)
      : GP_TROPE_TEASER;

  const seriesLine =
    book.series && book.seriesOrder !== null
      ? `${book.series} · Book ${book.seriesOrder}`
      : GP_SERIES_LINE_COMPACT;

  return (
    <section className="px-5 pb-10 pt-8 sm:px-8 sm:pt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-9 lg:flex-row lg:items-center lg:gap-14">
        <div className="mx-auto w-[62%] max-w-[280px] lg:mx-0 lg:w-[340px] lg:shrink-0">
          <BookCover
            book={book}
            format={model.formatRecord}
            priority
            sizes="(max-width: 640px) 62vw, (max-width: 1024px) 280px, 340px"
          />
        </div>

        <div className="lg:flex-1">
          <h1 className="text-balance font-display text-[length:var(--text-hook)] leading-[1.12] text-ivory">
            {hookLines.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 font-display text-[length:var(--text-display)] leading-[0.95] text-gold-bright">
            {book.title}
          </p>
          <p className="mt-2 text-[0.8rem] uppercase tracking-[0.22em] text-ink-muted">
            {seriesLine}
          </p>

          <div className="mt-5">
            <TropeTeaser labels={teaserLabels} />
          </div>

          {model.purchaseAvailable ? (
            <>
              <div className="mt-7 flex items-baseline gap-3">
                {price ? (
                  <span className="font-display text-3xl text-ivory">{price}</span>
                ) : null}
                {model.kuEnabled ? (
                  <span className="text-sm text-ink-muted">Also in Kindle Unlimited</span>
                ) : null}
              </div>

              <div className="mt-5 sm:max-w-sm">
                <BuyButton
                  bookSlug={book.slug}
                  bookTitle={book.title}
                  campaignId={model.campaign.campaignId}
                  placement="hero"
                  variant={model.variant}
                  experimentKey={model.experimentKey}
                  trafficSource={model.trafficSource}
                  format={model.format}
                  label={model.ctaLabel}
                  supportingLine={model.ctaSupportingLine}
                />
              </div>
            </>
          ) : (
            <div className="mt-7 sm:max-w-md">
              <PrelaunchNotice model={model} />
            </div>
          )}

          {model.seriesEntry ? (
            <p className="mt-7 text-[0.95rem] leading-relaxed text-ivory/80">
              <span className="block text-ink-muted">New to Hudson Dynasty?</span>
              <a
                href="#series-entry-heading"
                className="tap-target mt-1 inline-flex text-gold underline underline-offset-4 hover:text-gold-bright"
              >
                Start with Book 0 for {formatPrice(model.seriesEntry.priceUsd) ?? '$0.99'}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
