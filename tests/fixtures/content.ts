import type {
  AttributionLink,
  Book,
  BookFormatRecord,
  Campaign,
  LandingPage,
} from '@/lib/content/types';
import { EXPERIMENT_KEY } from '@/lib/experiments/definitions';

export function makeFormat(overrides: Partial<BookFormatRecord> = {}): BookFormatRecord {
  return {
    format: 'ebook',
    asin: 'B0H1F9PV97',
    priceUsd: 4.99,
    kuEnabled: true,
    amazonProductUrl: 'https://www.amazon.com/dp/B0H1F9PV97',
    amazonReviewUrl: null,
    coverSourceUrl: 'https://m.media-amazon.com/images/I/81iGQzEnacL._SL1500_.jpg',
    sourceWidth: 970,
    sourceHeight: 1500,
    coverAsset: {
      url: 'https://cdn.sanity.io/images/abc/production/cover-970x1500.jpg',
      assetId: 'image-abc-970x1500-jpg',
      width: 970,
      height: 1500,
      alt: 'cover',
    },
    active: true,
    ...overrides,
  };
}

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    _id: 'book.test',
    title: 'Golden Parachute',
    slug: 'golden-parachute',
    author: 'Reese Astor',
    series: 'Hudson Dynasty',
    seriesOrder: 3,
    genre: 'Adult Contemporary Billionaire Romance',
    publicationStatus: 'live',
    shortHook: 'He built his life to control every outcome.',
    longBlurb: ['Miri Doyle-Levine knows how to manage a crisis.'],
    tropes: [],
    contentNotes: [],
    formats: [makeFormat()],
    releaseStatus: 'Available now',
    ...overrides,
  };
}

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    _id: 'campaign.test',
    campaignId: 'GP_ORGANIC',
    slug: 'golden-parachute',
    trafficSource: 'organic',
    audience: null,
    creativeId: null,
    bookSlug: 'golden-parachute',
    landingPageSlug: 'golden-parachute',
    active: true,
    startsAt: null,
    endsAt: null,
    attributionLinks: [],
    ...overrides,
  };
}

export function makeAttributionLink(overrides: Partial<AttributionLink> = {}): AttributionLink {
  return {
    marketplace: 'https://www.amazon.com',
    experimentKey: EXPERIMENT_KEY,
    variant: 'control',
    format: 'ebook',
    // A representative Amazon Attribution URL shape, used only as test input.
    amazonAttributionUrl:
      'https://www.amazon.com/dp/B0H1F9PV97?maas=maas_adg_test_control&ref_=aa_maas',
    ...overrides,
  };
}

export function makeLandingPage(overrides: Partial<LandingPage> = {}): LandingPage {
  return {
    _id: 'landingPage.test',
    slug: 'golden-parachute',
    bookSlug: 'golden-parachute',
    campaignId: 'GP_ORGANIC',
    headline: 'He built his life to control every outcome.\nShe refuses to become another thing he can buy.',
    subheadline: 'An adult contemporary romance.',
    positioningLine: null,
    romancePromise: null,
    ctaLabel: 'Read Golden Parachute — $4.99',
    kuSupportLine: 'Also available with Kindle Unlimited',
    tropeOrder: [],
    socialProof: [],
    secondaryOffer: null,
    newsletterOffer: null,
    experimentKey: EXPERIMENT_KEY,
    seoIndexable: true,
    canonicalUrl: 'https://reeseastor.com/golden-parachute',
    seoTitle: 'Golden Parachute',
    seoDescription: 'Description.',
    ...overrides,
  };
}
