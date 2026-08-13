/**
 * Destination resolution for the tracked redirect.
 *
 * Order of preference:
 *   1. A campaign- and variant-specific Amazon Attribution URL.
 *   2. A campaign-level attribution URL for the same format (any variant).
 *   3. The plain Amazon product URL — organic traffic only.
 *
 * Paid traffic never falls through to step 3: without attribution the spend
 * cannot be measured against revenue, which is the whole point of the KPI.
 */

import { checkAmazonDestination } from './allowlist';
import type { AttributionLink, Book, BookFormat, Campaign } from '@/lib/content/types';
import { findCampaignById } from '@/lib/campaigns/registry';

export type DestinationKind = 'attribution_variant' | 'attribution_campaign' | 'product_url';

export type DestinationFailure =
  | 'format_not_found'
  | 'format_inactive'
  | 'no_destination_configured'
  | 'attribution_required'
  | 'destination_not_allowlisted';

export type DestinationResult =
  | { ok: true; url: string; kind: DestinationKind }
  | { ok: false; reason: DestinationFailure; detail?: string };

export function findFormat(book: Book, format: BookFormat) {
  return book.formats.find((f) => f.format === format) ?? null;
}

function matchAttribution(
  links: AttributionLink[],
  format: BookFormat,
  experimentKey: string | null,
  variant: string,
): { exact: AttributionLink | null; formatLevel: AttributionLink | null } {
  const forFormat = links.filter((link) => link.format === format);

  const exact =
    forFormat.find(
      (link) =>
        link.variant === variant &&
        (experimentKey === null || link.experimentKey === null || link.experimentKey === experimentKey),
    ) ?? null;

  return { exact, formatLevel: forFormat[0] ?? null };
}

export interface ResolveDestinationInput {
  book: Book;
  campaign: Campaign;
  format: BookFormat;
  variant: string;
  experimentKey: string | null;
}

export function resolveAmazonDestination(input: ResolveDestinationInput): DestinationResult {
  const { book, campaign, format, variant, experimentKey } = input;

  const formatRecord = findFormat(book, format);
  if (!formatRecord) {
    return { ok: false, reason: 'format_not_found', detail: `${book.slug}:${format}` };
  }
  if (!formatRecord.active) {
    return { ok: false, reason: 'format_inactive', detail: `${book.slug}:${format}` };
  }

  const definition = findCampaignById(campaign.campaignId);
  const requiresAttribution = definition?.requiresAttributionUrl ?? campaign.trafficSource !== 'organic';

  const { exact, formatLevel } = matchAttribution(
    campaign.attributionLinks ?? [],
    format,
    experimentKey,
    variant,
  );

  const candidates: Array<{ url: string | null; kind: DestinationKind }> = [
    { url: exact?.amazonAttributionUrl ?? null, kind: 'attribution_variant' },
    { url: formatLevel?.amazonAttributionUrl ?? null, kind: 'attribution_campaign' },
  ];

  if (!requiresAttribution) {
    candidates.push({ url: formatRecord.amazonProductUrl, kind: 'product_url' });
  }

  const chosen = candidates.find((candidate) => candidate.url !== null && candidate.url !== '');

  if (!chosen || !chosen.url) {
    return {
      ok: false,
      reason: requiresAttribution ? 'attribution_required' : 'no_destination_configured',
      detail: `${campaign.campaignId}:${book.slug}:${format}:${variant}`,
    };
  }

  const allowed = checkAmazonDestination(chosen.url);
  if (!allowed.ok) {
    return {
      ok: false,
      reason: 'destination_not_allowlisted',
      detail: `${campaign.campaignId}:${book.slug}:${allowed.reason}`,
    };
  }

  return { ok: true, url: allowed.url, kind: chosen.kind };
}
