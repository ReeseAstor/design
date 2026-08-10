/**
 * Seed-content source.
 *
 * When `NEXT_PUBLIC_SANITY_PROJECT_ID` is unset the site renders from the exact
 * supplied catalog seed plus the canonical Golden Parachute copy. Nothing here is
 * invented: every ASIN, price, product URL, cover source URL and dimension comes
 * from data/catalog.seed.json, and Golden Parachute deliberately carries no ASIN,
 * no product URL, no attribution URL and no cover.
 */

import catalogSeed from '@/data/catalog.seed.json';
import { CAMPAIGN_DEFINITIONS, ORGANIC_CAMPAIGN_ID } from '@/lib/campaigns/registry';
import {
  GOLDEN_PARACHUTE_SLUG,
  GP_CONTENT_NOTES,
  GP_CTA_LABEL,
  GP_HOOK_LINE_ONE,
  GP_HOOK_LINE_TWO,
  GP_KU_SUPPORT_LINE,
  GP_NEWSLETTER_OFFER,
  GP_POSITIONING_LINE,
  GP_PRIMARY_HOOK,
  GP_ROMANCE_PROMISE,
  GP_SEO_DESCRIPTION,
  GP_SEO_TITLE,
  GP_SERIES_ENTRY_OFFER,
  GP_SYNOPSIS,
  GP_TROPES,
} from '@/lib/content/golden-parachute';
import { EXPERIMENT_KEY } from '@/lib/experiments/definitions';
import type {
  Book,
  BookFormat,
  BookFormatRecord,
  Campaign,
  LandingPage,
  PublicationStatus,
} from '@/lib/content/types';
import { siteUrl } from '@/lib/config';

interface SeedFormat {
  format: string;
  asin: string | null;
  amazonUrl: string | null;
  amazonAttributionUrl?: string | null;
  coverSourceUrl: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  priceUsd: number | null;
  kuEnabled: boolean;
}

interface SeedBook {
  title: string;
  slug: string;
  author: string;
  series: string;
  seriesOrder: number;
  genre: string;
  publicationStatus: string;
  formats: SeedFormat[];
}

const seedBooks = catalogSeed.books as unknown as SeedBook[];

/**
 * Kindle Unlimited is a Kindle-ebook programme. The seed already reflects this,
 * but normalising here means a mistyped CMS entry can never render "Also in
 * Kindle Unlimited" under a paperback or an audiobook.
 */
export function normaliseKuEnabled(format: string, kuEnabled: boolean): boolean {
  return format === 'ebook' && kuEnabled === true;
}

function toFormatRecord(seed: SeedFormat, bookTitle: string): BookFormatRecord {
  return {
    format: seed.format as BookFormat,
    asin: seed.asin,
    priceUsd: seed.priceUsd,
    kuEnabled: normaliseKuEnabled(seed.format, seed.kuEnabled),
    amazonProductUrl: seed.amazonUrl,
    amazonReviewUrl: seed.asin ? `https://www.amazon.com/product-reviews/${seed.asin}` : null,
    coverSourceUrl: seed.coverSourceUrl,
    sourceWidth: seed.sourceWidth,
    sourceHeight: seed.sourceHeight,
    // Seed mode has no Sanity asset. Components fall back to the CSS-only cover
    // placeholder, or (in development only) to the Amazon source URL.
    coverAsset: null,
    active: true,
  };
}

function seedBookToBook(seed: SeedBook): Book {
  const isGoldenParachute = seed.slug === GOLDEN_PARACHUTE_SLUG;
  return {
    _id: `seed.book.${seed.slug}`,
    title: seed.title,
    slug: seed.slug,
    author: seed.author,
    series: seed.series,
    seriesOrder: seed.seriesOrder,
    genre: seed.genre,
    publicationStatus: seed.publicationStatus as PublicationStatus,
    shortHook: isGoldenParachute ? GP_PRIMARY_HOOK : null,
    longBlurb: isGoldenParachute ? GP_SYNOPSIS : [],
    tropes: isGoldenParachute ? GP_TROPES : [],
    contentNotes: isGoldenParachute ? GP_CONTENT_NOTES : [],
    formats: seed.formats.map((f) => toFormatRecord(f, seed.title)),
    releaseStatus: seed.publicationStatus === 'prelaunch' ? 'Announced' : 'Available now',
  };
}

export function seedBookList(): Book[] {
  return seedBooks.map(seedBookToBook);
}

export function seedBookBySlug(slug: string): Book | null {
  const found = seedBooks.find((b) => b.slug === slug);
  return found ? seedBookToBook(found) : null;
}

export function seedCampaigns(): Campaign[] {
  return CAMPAIGN_DEFINITIONS.map((definition) => ({
    _id: `seed.campaign.${definition.campaignId}`,
    campaignId: definition.campaignId,
    slug: definition.slug,
    trafficSource: definition.trafficSource,
    audience: definition.audience,
    creativeId: null,
    bookSlug: definition.bookSlug,
    landingPageSlug: definition.landingPageSlug,
    active: true,
    startsAt: null,
    endsAt: null,
    // No attribution URLs are fabricated. Paid campaigns stay unpublishable
    // until a real Amazon Attribution URL is entered in Sanity.
    attributionLinks: [],
  }));
}

export function seedCampaignById(campaignId: string): Campaign | null {
  return seedCampaigns().find((c) => c.campaignId === campaignId) ?? null;
}

/**
 * Every campaign renders the same Golden Parachute offer. Only the campaign
 * binding, indexability and canonical URL differ — deliberately, so that the
 * single running experiment is the only thing changing between variants.
 */
export function seedLandingPage(campaignId: string): LandingPage | null {
  const definition = CAMPAIGN_DEFINITIONS.find((c) => c.campaignId === campaignId);
  if (!definition) return null;

  return {
    _id: `seed.landingPage.${definition.landingPageSlug}`,
    slug: definition.landingPageSlug,
    bookSlug: definition.bookSlug,
    campaignId: definition.campaignId,
    headline: `${GP_HOOK_LINE_ONE}\n${GP_HOOK_LINE_TWO}`,
    subheadline: GP_POSITIONING_LINE,
    positioningLine: GP_POSITIONING_LINE,
    romancePromise: GP_ROMANCE_PROMISE,
    ctaLabel: GP_CTA_LABEL,
    kuSupportLine: GP_KU_SUPPORT_LINE,
    tropeOrder: GP_TROPES,
    // No testimonial, rating or review count exists yet, so none is rendered.
    socialProof: [],
    secondaryOffer: GP_SERIES_ENTRY_OFFER,
    newsletterOffer: GP_NEWSLETTER_OFFER,
    experimentKey: EXPERIMENT_KEY,
    seoIndexable: definition.seoIndexable,
    canonicalUrl: `${siteUrl()}/golden-parachute`,
    seoTitle: GP_SEO_TITLE,
    seoDescription: GP_SEO_DESCRIPTION,
  };
}

export const SEED_ORGANIC_CAMPAIGN_ID = ORGANIC_CAMPAIGN_ID;
