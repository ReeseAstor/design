/**
 * Domain types shared by the Sanity-backed content source and the seed-content
 * fallback. Both sources normalise into exactly these shapes so that every page,
 * route handler and test consumes one representation.
 */

export const BOOK_FORMATS = ['ebook', 'audiobook', 'paperback'] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const PUBLICATION_STATUSES = ['live', 'prelaunch', 'archived'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const TRAFFIC_SOURCES = ['organic', 'meta', 'tiktok', 'bookbub', 'newsletter'] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

/** The only CTA placements the tracked redirect will accept. */
export const CTA_PLACEMENTS = [
  'hero',
  'sticky_mobile',
  'mid_blurb',
  'series_entry',
  'footer',
] as const;
export type CtaPlacement = (typeof CTA_PLACEMENTS)[number];

export interface CoverAsset {
  /** Sanity CDN URL for the imported asset. Null until import-cover-assets runs. */
  url: string | null;
  /** Sanity asset `_id`, preserved so the Studio can re-reference the upload. */
  assetId: string | null;
  width: number | null;
  height: number | null;
  alt: string;
}

export interface BookFormatRecord {
  format: BookFormat;
  asin: string | null;
  priceUsd: number | null;
  /** Kindle Unlimited applies to Kindle ebooks only — never audiobook/paperback. */
  kuEnabled: boolean;
  amazonProductUrl: string | null;
  amazonReviewUrl: string | null;
  /** Import provenance: the original SL1500 URL and its dimensions. */
  coverSourceUrl: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  /** Production cover, resolved from the Sanity image asset. */
  coverAsset: CoverAsset | null;
  active: boolean;
}

export interface Book {
  _id: string;
  title: string;
  slug: string;
  author: string;
  series: string | null;
  seriesOrder: number | null;
  genre: string | null;
  publicationStatus: PublicationStatus;
  shortHook: string | null;
  longBlurb: string[];
  tropes: Trope[];
  contentNotes: string[];
  formats: BookFormatRecord[];
  releaseStatus: string | null;
}

export interface Trope {
  label: string;
  description: string;
}

export interface AttributionLink {
  marketplace: string;
  experimentKey: string | null;
  variant: string;
  format: BookFormat;
  amazonAttributionUrl: string;
}

export interface Campaign {
  _id: string;
  campaignId: string;
  /** Route segment under /gp/, or the literal 'golden-parachute' organic route. */
  slug: string;
  trafficSource: TrafficSource;
  audience: string | null;
  creativeId: string | null;
  bookSlug: string;
  landingPageSlug: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  attributionLinks: AttributionLink[];
}

export interface SocialProofItem {
  _id: string;
  quote: string;
  displayName: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  approved: boolean;
  approvedAt: string | null;
  rating: number | null;
  ratingScale: number | null;
  reviewCount: number | null;
  lastVerifiedAt: string | null;
}

export interface SecondaryOffer {
  eyebrow: string;
  headline: string;
  body: string | null;
  ctaLabel: string;
  bookSlug: string;
  format: BookFormat;
}

export interface NewsletterOffer {
  offerId: string;
  title: string;
  ctaLabel: string;
  promise: string;
  recoveryHeadline: string;
  recoveryBody: string;
  recoveryCtaLabel: string;
  returningHeadline: string;
  returningBody: string;
}

export interface LandingPage {
  _id: string;
  slug: string;
  bookSlug: string;
  campaignId: string;
  headline: string;
  subheadline: string;
  positioningLine: string | null;
  romancePromise: string | null;
  ctaLabel: string;
  kuSupportLine: string;
  tropeOrder: Trope[];
  socialProof: SocialProofItem[];
  secondaryOffer: SecondaryOffer | null;
  newsletterOffer: NewsletterOffer | null;
  experimentKey: string | null;
  seoIndexable: boolean;
  canonicalUrl: string;
  seoTitle: string;
  seoDescription: string;
}

/** Everything a conversion page needs, resolved in one server-side pass. */
export interface LandingPageBundle {
  landingPage: LandingPage;
  book: Book;
  campaign: Campaign;
  /** Book 0 of the series, used by the series-entry offer. */
  seriesEntryBook: Book | null;
}
