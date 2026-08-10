/**
 * The campaign registry is the allowlist that makes `/go/[book]/amazon` safe.
 *
 * A campaign ID that is not in this registry (or, once Sanity is configured, not
 * a published campaign document) can never resolve to an external destination.
 */

import { GOLDEN_PARACHUTE_SLUG } from '@/lib/content/golden-parachute';
import type { TrafficSource } from '@/lib/content/types';

export interface CampaignDefinition {
  campaignId: string;
  /** Route slug. The organic campaign lives at /golden-parachute; the rest at /gp/<slug>. */
  slug: string;
  route: string;
  trafficSource: TrafficSource;
  audience: string | null;
  bookSlug: string;
  landingPageSlug: string;
  seoIndexable: boolean;
  /** Paid traffic must not reach Amazon without an attribution URL. */
  requiresAttributionUrl: boolean;
}

export const ORGANIC_CAMPAIGN_ID = 'GP_ORGANIC';

export const CAMPAIGN_DEFINITIONS: readonly CampaignDefinition[] = [
  {
    campaignId: ORGANIC_CAMPAIGN_ID,
    slug: GOLDEN_PARACHUTE_SLUG,
    route: '/golden-parachute',
    trafficSource: 'organic',
    audience: 'Organic and direct',
    bookSlug: GOLDEN_PARACHUTE_SLUG,
    landingPageSlug: GOLDEN_PARACHUTE_SLUG,
    seoIndexable: true,
    requiresAttributionUrl: false,
  },
  {
    campaignId: 'GP_META_FORCEDPROX',
    slug: 'meta-forced-proximity',
    route: '/gp/meta-forced-proximity',
    trafficSource: 'meta',
    audience: 'Meta — forced proximity interest',
    bookSlug: GOLDEN_PARACHUTE_SLUG,
    landingPageSlug: 'gp-meta-forced-proximity',
    seoIndexable: false,
    requiresAttributionUrl: true,
  },
  {
    campaignId: 'GP_TIKTOK_KAI',
    slug: 'tiktok-kai',
    route: '/gp/tiktok-kai',
    trafficSource: 'tiktok',
    audience: 'TikTok — Kai character hook',
    bookSlug: GOLDEN_PARACHUTE_SLUG,
    landingPageSlug: 'gp-tiktok-kai',
    seoIndexable: false,
    requiresAttributionUrl: true,
  },
  {
    campaignId: 'GP_BOOKBUB_BILLIONAIRE',
    slug: 'bookbub-billionaire',
    route: '/gp/bookbub-billionaire',
    trafficSource: 'bookbub',
    audience: 'BookBub — billionaire romance',
    bookSlug: GOLDEN_PARACHUTE_SLUG,
    landingPageSlug: 'gp-bookbub-billionaire',
    seoIndexable: false,
    requiresAttributionUrl: true,
  },
  {
    campaignId: 'GP_NEWSLETTER_EXISTING',
    slug: 'newsletter',
    route: '/gp/newsletter',
    trafficSource: 'newsletter',
    audience: 'Existing reader list',
    bookSlug: GOLDEN_PARACHUTE_SLUG,
    landingPageSlug: 'gp-newsletter',
    seoIndexable: false,
    requiresAttributionUrl: true,
  },
] as const;

export const CAMPAIGN_IDS: readonly string[] = CAMPAIGN_DEFINITIONS.map((c) => c.campaignId);

/** Paid campaign slugs served by /gp/[campaignSlug]. */
export const PAID_CAMPAIGN_SLUGS: readonly string[] = CAMPAIGN_DEFINITIONS.filter(
  (c) => c.trafficSource !== 'organic',
).map((c) => c.slug);

export function findCampaignById(campaignId: string | null | undefined): CampaignDefinition | null {
  if (!campaignId) return null;
  return CAMPAIGN_DEFINITIONS.find((c) => c.campaignId === campaignId) ?? null;
}

export function findCampaignBySlug(slug: string | null | undefined): CampaignDefinition | null {
  if (!slug) return null;
  return CAMPAIGN_DEFINITIONS.find((c) => c.slug === slug) ?? null;
}

/**
 * Campaigns that sell a book other than Golden Parachute still need an ID for
 * tracked links (the Hudson Dynasty page links to Book 0, for example). Those
 * links reuse the campaign of the page they were clicked from, so there is no
 * separate registry entry.
 */
export function isKnownCampaignId(campaignId: string): boolean {
  return CAMPAIGN_IDS.includes(campaignId);
}
