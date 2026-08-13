/**
 * Builds everything a conversion page renders, on the server, in one place.
 *
 * Keeping the decisions here — which variant, whether the purchase CTA may
 * appear, whether the reader is returning — means the page components stay
 * presentational and the rules stay testable without a DOM.
 */

import { findFormat } from '@/lib/amazon/destination';
import { ctaCopyForVariant, type ExperimentVariant } from '@/lib/experiments/definitions';
import { evaluatePublication, logPublicationFailures, type GuardFailure } from '@/lib/publication/guard';
import type {
  Book,
  BookFormat,
  BookFormatRecord,
  Campaign,
  LandingPage,
  LandingPageBundle,
  SocialProofItem,
  TrafficSource,
} from '@/lib/content/types';

export interface ConversionViewModel {
  landingPage: LandingPage;
  book: Book;
  campaign: Campaign;
  trafficSource: TrafficSource;

  /** Primary format sold by this page. */
  format: BookFormat;
  formatRecord: BookFormatRecord | null;
  priceUsd: number | null;
  kuEnabled: boolean;

  experimentKey: string | null;
  variant: ExperimentVariant;
  ctaLabel: string;
  ctaSupportingLine: string;

  /** False when the publication guard blocks the purchase CTA. */
  purchaseAvailable: boolean;
  guardFailures: GuardFailure[];

  /** Book 0 offer, only present when it has a working destination of its own. */
  seriesEntry: {
    book: Book;
    format: BookFormat;
    formatRecord: BookFormatRecord;
    priceUsd: number | null;
  } | null;

  socialProof: SocialProofItem[];
  returningReader: boolean;

  /** Paid campaign pages render no navigation above the first CTA. */
  showSiteNavigation: boolean;
  indexable: boolean;
}

export interface BuildViewModelInput {
  bundle: LandingPageBundle;
  variant: ExperimentVariant;
  returningReader: boolean;
  format?: BookFormat;
  now?: Date;
}

export function buildConversionViewModel(input: BuildViewModelInput): ConversionViewModel {
  const { bundle, variant, returningReader } = input;
  const { landingPage, book, campaign, seriesEntryBook } = bundle;
  const format: BookFormat = input.format ?? 'ebook';

  const formatRecord = findFormat(book, format);

  const verdict = evaluatePublication({
    landingPage,
    book,
    campaign,
    format,
    variant,
    now: input.now,
  });

  if (!verdict.publishable) {
    logPublicationFailures(`${campaign.campaignId} → ${book.slug}`, verdict.failures);
  }

  const kuEnabled = formatRecord?.kuEnabled ?? false;
  const cta = ctaCopyForVariant(variant, {
    priceUsd: formatRecord?.priceUsd ?? null,
    kuEnabled,
    title: book.title,
  });

  // Book 0 is offered only when it can actually be bought: the whole point of
  // the secondary offer is to keep a reader who is not ready for Book 3 inside
  // the series rather than sending them to a dead end.
  const seriesEntryFormat = seriesEntryBook ? findFormat(seriesEntryBook, 'ebook') : null;
  const seriesEntryUsable =
    seriesEntryBook &&
    seriesEntryFormat &&
    seriesEntryFormat.active &&
    Boolean(seriesEntryFormat.amazonProductUrl) &&
    seriesEntryBook.slug !== book.slug;

  return {
    landingPage,
    book,
    campaign,
    trafficSource: campaign.trafficSource,
    format,
    formatRecord,
    priceUsd: formatRecord?.priceUsd ?? null,
    kuEnabled,
    experimentKey: landingPage.experimentKey,
    variant,
    ctaLabel: cta.label,
    ctaSupportingLine: cta.supportingLine,
    purchaseAvailable: verdict.publishable,
    guardFailures: verdict.failures,
    seriesEntry:
      seriesEntryUsable && seriesEntryBook && seriesEntryFormat
        ? {
            book: seriesEntryBook,
            format: 'ebook',
            formatRecord: seriesEntryFormat,
            priceUsd: seriesEntryFormat.priceUsd,
          }
        : null,
    socialProof: landingPage.socialProof.filter((item) => item.approved === true),
    returningReader,
    showSiteNavigation: campaign.trafficSource === 'organic',
    indexable: landingPage.seoIndexable,
  };
}

export function formatPrice(priceUsd: number | null): string | null {
  if (priceUsd === null || Number.isNaN(priceUsd)) return null;
  return `$${priceUsd.toFixed(2)}`;
}
