/**
 * Publication guard.
 *
 * A purchase page may only show a Buy button when every ingredient of a working
 * purchase exists. When one is missing the page renders its prelaunch state —
 * the offer is presented as not yet available, with the series-entry and bonus
 * offers carrying the page — rather than a button that 404s or lands on a
 * placeholder.
 */

import { resolveAmazonDestination } from '@/lib/amazon/destination';
import { findCampaignById } from '@/lib/campaigns/registry';
import type { Book, BookFormat, Campaign, LandingPage } from '@/lib/content/types';
import { findFormat } from '@/lib/amazon/destination';

export type GuardFailureCode =
  | 'book_missing'
  | 'headline_missing'
  | 'cta_missing'
  | 'price_missing'
  | 'ku_status_missing'
  | 'cover_missing'
  | 'destination_missing'
  | 'campaign_inactive'
  | 'campaign_window_closed'
  | 'attribution_url_missing';

export interface GuardFailure {
  code: GuardFailureCode;
  message: string;
}

export type PublicationVerdict =
  | { publishable: true; failures: [] }
  | { publishable: false; failures: GuardFailure[] };

export interface GuardInput {
  landingPage: LandingPage | null;
  book: Book | null;
  campaign: Campaign | null;
  format: BookFormat;
  variant: string;
  now?: Date;
}

function campaignWindowOpen(campaign: Campaign, now: Date): boolean {
  if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now.getTime()) return false;
  if (campaign.endsAt && new Date(campaign.endsAt).getTime() < now.getTime()) return false;
  return true;
}

export function evaluatePublication(input: GuardInput): PublicationVerdict {
  const { landingPage, book, campaign, format, variant } = input;
  const now = input.now ?? new Date();
  const failures: GuardFailure[] = [];

  if (!book) {
    return {
      publishable: false,
      failures: [{ code: 'book_missing', message: 'No book document resolved for this page.' }],
    };
  }

  if (!landingPage?.headline?.trim()) {
    failures.push({ code: 'headline_missing', message: 'Landing page has no headline.' });
  }
  if (!landingPage?.ctaLabel?.trim()) {
    failures.push({ code: 'cta_missing', message: 'Landing page has no CTA label.' });
  }

  const formatRecord = findFormat(book, format);

  if (!formatRecord || formatRecord.priceUsd === null) {
    failures.push({
      code: 'price_missing',
      message: `No current price for ${book.slug} (${format}).`,
    });
  }
  if (!formatRecord) {
    failures.push({
      code: 'ku_status_missing',
      message: `No Kindle Unlimited status for ${book.slug} (${format}).`,
    });
  }
  if (!formatRecord?.coverAsset?.url) {
    failures.push({
      code: 'cover_missing',
      message: `No approved Sanity cover asset for ${book.slug} (${format}). Run scripts/import-cover-assets.ts once the final cover is delivered.`,
    });
  }

  if (!campaign) {
    failures.push({ code: 'campaign_inactive', message: 'No campaign document resolved.' });
    return { publishable: false, failures };
  }

  if (!campaign.active) {
    failures.push({
      code: 'campaign_inactive',
      message: `Campaign ${campaign.campaignId} is not active.`,
    });
  }
  if (!campaignWindowOpen(campaign, now)) {
    failures.push({
      code: 'campaign_window_closed',
      message: `Campaign ${campaign.campaignId} is outside its scheduled window.`,
    });
  }

  const definition = findCampaignById(campaign.campaignId);
  const requiresAttribution =
    definition?.requiresAttributionUrl ?? campaign.trafficSource !== 'organic';

  const destination = resolveAmazonDestination({
    book,
    campaign,
    format,
    variant,
    experimentKey: landingPage?.experimentKey ?? null,
  });

  if (!destination.ok) {
    if (requiresAttribution && destination.reason === 'attribution_required') {
      failures.push({
        code: 'attribution_url_missing',
        message: `Campaign ${campaign.campaignId} has no Amazon Attribution URL for format "${format}", variant "${variant}". Paid campaigns must not publish without one.`,
      });
    } else {
      failures.push({
        code: 'destination_missing',
        message: `No valid Amazon destination for ${book.slug} (${format}) on ${campaign.campaignId}: ${destination.reason}.`,
      });
    }
  }

  if (failures.length > 0) {
    return { publishable: false, failures };
  }
  return { publishable: true, failures: [] };
}

/**
 * A configuration failure is an operations problem, not a reader-facing one. It
 * is logged with enough detail to fix, and the page degrades quietly.
 */
export function logPublicationFailures(context: string, failures: GuardFailure[]): void {
  if (failures.length === 0) return;
  for (const failure of failures) {
    console.error(`[publication-guard] ${context} — ${failure.code}: ${failure.message}`);
  }
}
