import { BookCover } from './BookCover';
import { BuyButton } from './BuyButton';
import { formatPrice, type ConversionViewModel } from '@/lib/conversion/view-model';

/**
 * The Book 0 entry offer.
 *
 * Deliberately quieter than the primary CTA: it exists to catch the reader who
 * will not start a series at Book 3, not to compete with the sale in front of
 * them. It only renders when Book 0 has a real destination.
 */
export function SeriesEntryOffer({ model }: { model: ConversionViewModel }) {
  const entry = model.seriesEntry;
  if (!entry) return null;

  const offer = model.landingPage.secondaryOffer;
  const price = formatPrice(entry.priceUsd);
  const heading = offer?.headline ?? (price ? `Start with Book 0 for ${price}` : 'Start with Book 0');
  const ctaLabel = offer?.ctaLabel ?? heading;

  return (
    <section
      aria-labelledby="series-entry-heading"
      className="border-y border-line bg-graphite/40 px-5 py-12 sm:px-8"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-7 sm:flex-row sm:items-center">
        <div className="w-28 shrink-0 sm:w-32">
          <BookCover
            book={entry.book}
            format={entry.formatRecord}
            sizes="(max-width: 640px) 112px, 128px"
          />
        </div>

        <div className="flex-1">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold">
            {offer?.eyebrow ?? 'New to Hudson Dynasty?'}
          </p>
          <h2 id="series-entry-heading" className="mt-3 font-display text-2xl text-ivory">
            {heading}
          </h2>
          {offer?.body ? (
            <p className="mt-2.5 text-pretty text-[0.95rem] leading-relaxed text-ivory/80">
              {offer.body}
            </p>
          ) : null}

          <div className="mt-5 sm:max-w-sm">
            <BuyButton
              bookSlug={entry.book.slug}
              bookTitle={entry.book.title}
              campaignId={model.campaign.campaignId}
              placement="series_entry"
              variant={model.variant}
              experimentKey={model.experimentKey}
              trafficSource={model.trafficSource}
              format={entry.format}
              label={ctaLabel}
              intent="book0"
              tone="outline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
