/**
 * Seeds Sanity from data/catalog.seed.json plus the canonical Golden Parachute
 * copy.
 *
 *   npm run seed:catalog -- --dry-run   # print the transaction, write nothing
 *   npm run seed:catalog                # create or replace the documents
 *
 * Deterministic document IDs mean the script is safe to re-run: it replaces its
 * own documents and never duplicates them. Editor changes to fields the seed
 * does not own are preserved by `createIfNotExists` for the campaign attribution
 * links, which are the one thing the seed deliberately refuses to invent.
 */

import catalog from '../data/catalog.seed.json';
import { CAMPAIGN_DEFINITIONS } from '../lib/campaigns/registry';
import {
  GOLDEN_PARACHUTE_SLUG,
  GP_CONTENT_NOTES,
  GP_CTA_LABEL,
  GP_HOOK_LINE_ONE,
  GP_HOOK_LINE_TWO,
  GP_KU_SUPPORT_LINE,
  GP_NEWSLETTER_OFFER,
  GP_POSITIONING_LINE,
  GP_ROMANCE_PROMISE,
  GP_SEO_DESCRIPTION,
  GP_SEO_TITLE,
  GP_SERIES_ENTRY_OFFER,
  GP_SYNOPSIS,
  GP_TROPES,
} from '../lib/content/golden-parachute';
import { EXPERIMENT_KEY } from '../lib/experiments/definitions';
import { createWriteClient, isDryRun } from './sanity-write-client';

interface SeedFormat {
  format: string;
  asin: string | null;
  amazonUrl: string | null;
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

const books = catalog.books as unknown as SeedBook[];

export const bookDocId = (slug: string) => `book.${slug}`;
export const campaignDocId = (campaignId: string) => `campaign.${campaignId.toLowerCase()}`;
export const landingPageDocId = (slug: string) => `landingPage.${slug}`;

export function buildBookDocument(book: SeedBook) {
  const isGoldenParachute = book.slug === GOLDEN_PARACHUTE_SLUG;

  return {
    _id: bookDocId(book.slug),
    _type: 'book',
    title: book.title,
    slug: { _type: 'slug', current: book.slug },
    author: book.author,
    series: book.series,
    series_order: book.seriesOrder,
    genre: book.genre,
    publication_status: book.publicationStatus,
    short_hook: isGoldenParachute ? `${GP_HOOK_LINE_ONE}\n${GP_HOOK_LINE_TWO}` : undefined,
    long_blurb: isGoldenParachute ? GP_SYNOPSIS : undefined,
    tropes: isGoldenParachute
      ? GP_TROPES.map((trope, index) => ({
          _key: `trope-${index}`,
          _type: 'trope',
          label: trope.label,
          description: trope.description,
        }))
      : undefined,
    content_notes: isGoldenParachute ? GP_CONTENT_NOTES : undefined,
    release_status: book.publicationStatus === 'prelaunch' ? 'Announced' : 'Available now',
    formats: book.formats.map((format, index) => ({
      _key: `format-${format.format}-${index}`,
      _type: 'bookFormat',
      format: format.format,
      asin: format.asin ?? undefined,
      price_usd: format.priceUsd ?? undefined,
      // Kindle Unlimited is a Kindle-ebook programme; the seed data already
      // reflects that and this keeps it true if the JSON is ever edited.
      ku_enabled: format.format === 'ebook' ? format.kuEnabled === true : false,
      amazon_product_url: format.amazonUrl ?? undefined,
      amazon_review_url: format.asin
        ? `https://www.amazon.com/product-reviews/${format.asin}`
        : undefined,
      cover_source_url: format.coverSourceUrl ?? undefined,
      source_width: format.sourceWidth ?? undefined,
      source_height: format.sourceHeight ?? undefined,
      active: true,
    })),
  };
}

export function buildLandingPageDocument(definition: (typeof CAMPAIGN_DEFINITIONS)[number]) {
  return {
    _id: landingPageDocId(definition.landingPageSlug),
    _type: 'landingPage',
    slug: { _type: 'slug', current: definition.landingPageSlug },
    book_reference: { _type: 'reference', _ref: bookDocId(definition.bookSlug) },
    campaign_reference: { _type: 'reference', _ref: campaignDocId(definition.campaignId) },
    headline: `${GP_HOOK_LINE_ONE}\n${GP_HOOK_LINE_TWO}`,
    subheadline: GP_POSITIONING_LINE,
    positioning_line: GP_POSITIONING_LINE,
    romance_promise: GP_ROMANCE_PROMISE,
    cta_label: GP_CTA_LABEL,
    ku_support_line: GP_KU_SUPPORT_LINE,
    trope_order: GP_TROPES.map((trope, index) => ({
      _key: `trope-${index}`,
      _type: 'trope',
      label: trope.label,
      description: trope.description,
    })),
    // No social proof is seeded. Nothing renders until a real, approved quote
    // exists in the Studio.
    social_proof: [],
    secondary_offer: {
      eyebrow: GP_SERIES_ENTRY_OFFER.eyebrow,
      headline: GP_SERIES_ENTRY_OFFER.headline,
      body: GP_SERIES_ENTRY_OFFER.body,
      cta_label: GP_SERIES_ENTRY_OFFER.ctaLabel,
      book_reference: { _type: 'reference', _ref: bookDocId(GP_SERIES_ENTRY_OFFER.bookSlug) },
      format: GP_SERIES_ENTRY_OFFER.format,
    },
    newsletter_offer: {
      offer_id: GP_NEWSLETTER_OFFER.offerId,
      title: GP_NEWSLETTER_OFFER.title,
      cta_label: GP_NEWSLETTER_OFFER.ctaLabel,
      promise: GP_NEWSLETTER_OFFER.promise,
      recovery_headline: GP_NEWSLETTER_OFFER.recoveryHeadline,
      recovery_body: GP_NEWSLETTER_OFFER.recoveryBody,
      recovery_cta_label: GP_NEWSLETTER_OFFER.recoveryCtaLabel,
      returning_headline: GP_NEWSLETTER_OFFER.returningHeadline,
      returning_body: GP_NEWSLETTER_OFFER.returningBody,
    },
    experiment_key: EXPERIMENT_KEY,
    seo_indexable: definition.seoIndexable,
    canonical_url: 'https://reeseastor.com/golden-parachute',
    seo_title: GP_SEO_TITLE,
    seo_description: GP_SEO_DESCRIPTION,
  };
}

export function buildCampaignDocument(definition: (typeof CAMPAIGN_DEFINITIONS)[number]) {
  return {
    _id: campaignDocId(definition.campaignId),
    _type: 'campaign',
    campaign_id: definition.campaignId,
    slug: { _type: 'slug', current: definition.slug },
    traffic_source: definition.trafficSource,
    audience: definition.audience ?? undefined,
    book_reference: { _type: 'reference', _ref: bookDocId(definition.bookSlug) },
    landing_page_reference: {
      _type: 'reference',
      _ref: landingPageDocId(definition.landingPageSlug),
    },
    active: true,
    // attribution_links is intentionally omitted. Paid campaigns stay
    // unpublishable until a real Amazon Attribution URL is pasted in the Studio;
    // seeding a placeholder here would defeat the publication guard.
  };
}

async function main() {
  const dryRun = isDryRun();

  const bookDocs = books.map(buildBookDocument);
  const campaignDocs = CAMPAIGN_DEFINITIONS.map(buildCampaignDocument);
  const landingPageDocs = CAMPAIGN_DEFINITIONS.map(buildLandingPageDocument);

  console.log(
    `Seeding ${bookDocs.length} books, ${campaignDocs.length} campaigns, ${landingPageDocs.length} landing pages.`,
  );

  if (dryRun) {
    console.log(JSON.stringify({ bookDocs, campaignDocs, landingPageDocs }, null, 2));
    console.log('\nDry run — nothing was written.');
    return;
  }

  const client = createWriteClient();
  const transaction = client.transaction();

  for (const doc of bookDocs) transaction.createOrReplace(doc);
  // Campaigns are created but never replaced: replacing would wipe the
  // attribution links an operator entered by hand.
  for (const doc of campaignDocs) transaction.createIfNotExists(doc);
  for (const doc of landingPageDocs) transaction.createOrReplace(doc);

  await transaction.commit();

  console.log('Seed complete.');
  console.log(
    'Next: run `npm run import:covers` to upload the 24 live cover assets into Sanity.',
  );
  console.log(
    'Golden Parachute has no ASIN, product URL, attribution URL or cover. Enter them in the Studio when KDP publishes the title.',
  );
}

// Only run when executed directly, so the builders above stay importable by tests.
if (process.argv[1] && process.argv[1].includes('seed-catalog')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
