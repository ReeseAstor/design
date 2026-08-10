import { defineQuery } from 'next-sanity';

/**
 * Projections resolve image asset metadata inline so that a page render is a
 * single round trip and `next/image` always receives real intrinsic dimensions
 * (which is how the cover loads without shifting the layout).
 */
const FORMAT_PROJECTION = /* groq */ `
  format,
  asin,
  "priceUsd": price_usd,
  "kuEnabled": ku_enabled,
  "amazonProductUrl": amazon_product_url,
  "amazonReviewUrl": amazon_review_url,
  "coverSourceUrl": cover_source_url,
  "sourceWidth": source_width,
  "sourceHeight": source_height,
  "coverAsset": cover_asset.asset->{
    "url": url,
    "assetId": _id,
    "width": metadata.dimensions.width,
    "height": metadata.dimensions.height
  },
  "active": coalesce(active, true)
`;

const BOOK_PROJECTION = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  author,
  series,
  "seriesOrder": series_order,
  genre,
  "publicationStatus": publication_status,
  "shortHook": short_hook,
  "longBlurb": long_blurb,
  "tropes": tropes[]{ label, description },
  "contentNotes": content_notes,
  "releaseStatus": release_status,
  "formats": formats[]{ ${FORMAT_PROJECTION} }
`;

const CAMPAIGN_PROJECTION = /* groq */ `
  _id,
  "campaignId": campaign_id,
  "slug": slug.current,
  "trafficSource": traffic_source,
  audience,
  "creativeId": creative_id,
  "bookSlug": book_reference->slug.current,
  "landingPageSlug": landing_page_reference->slug.current,
  active,
  "startsAt": starts_at,
  "endsAt": ends_at,
  "attributionLinks": attribution_links[]{
    marketplace,
    "experimentKey": experiment_key,
    variant,
    format,
    "amazonAttributionUrl": amazon_attribution_url
  }
`;

const SOCIAL_PROOF_PROJECTION = /* groq */ `
  _id,
  quote,
  "displayName": display_name,
  "sourceName": source_name,
  "sourceUrl": source_url,
  approved,
  "approvedAt": approved_at,
  rating,
  "ratingScale": rating_scale,
  "reviewCount": review_count,
  "lastVerifiedAt": last_verified_at
`;

const LANDING_PAGE_PROJECTION = /* groq */ `
  _id,
  "slug": slug.current,
  "bookSlug": book_reference->slug.current,
  "campaignId": campaign_reference->campaign_id,
  headline,
  subheadline,
  "positioningLine": positioning_line,
  "romancePromise": romance_promise,
  "ctaLabel": cta_label,
  "kuSupportLine": ku_support_line,
  "tropeOrder": trope_order[]{ label, description },
  "socialProof": social_proof[]->{ ${SOCIAL_PROOF_PROJECTION} },
  "secondaryOffer": secondary_offer{
    eyebrow,
    headline,
    body,
    "ctaLabel": cta_label,
    "bookSlug": book_reference->slug.current,
    format
  },
  "newsletterOffer": newsletter_offer{
    "offerId": offer_id,
    title,
    "ctaLabel": cta_label,
    promise,
    "recoveryHeadline": recovery_headline,
    "recoveryBody": recovery_body,
    "recoveryCtaLabel": recovery_cta_label,
    "returningHeadline": returning_headline,
    "returningBody": returning_body
  },
  "experimentKey": experiment_key,
  "seoIndexable": seo_indexable,
  "canonicalUrl": canonical_url,
  "seoTitle": seo_title,
  "seoDescription": seo_description
`;

export const bookBySlugQuery = defineQuery(/* groq */ `
  *[_type == "book" && slug.current == $slug][0]{ ${BOOK_PROJECTION} }
`);

export const allBooksQuery = defineQuery(/* groq */ `
  *[_type == "book" && publication_status != "archived"]
    | order(series asc, series_order asc){ ${BOOK_PROJECTION} }
`);

export const booksBySeriesQuery = defineQuery(/* groq */ `
  *[_type == "book" && series == $series && publication_status != "archived"]
    | order(series_order asc){ ${BOOK_PROJECTION} }
`);

export const campaignByIdQuery = defineQuery(/* groq */ `
  *[_type == "campaign" && campaign_id == $campaignId][0]{ ${CAMPAIGN_PROJECTION} }
`);

export const landingPageByCampaignQuery = defineQuery(/* groq */ `
  *[_type == "landingPage" && campaign_reference->campaign_id == $campaignId][0]{ ${LANDING_PAGE_PROJECTION} }
`);

export const publishedBookSlugsQuery = defineQuery(/* groq */ `
  *[_type == "book" && publication_status == "live"].slug.current
`);
