/**
 * Environment access. Every value has a safe default so that a fresh clone with
 * no `.env.local` boots into seed-content + no-op analytics mode instead of
 * crashing — and so that no secret is ever read through a NEXT_PUBLIC_* name.
 */

const DEFAULT_SITE_URL = 'https://reeseastor.com';

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_ENV === 'production'
      ? DEFAULT_SITE_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : DEFAULT_SITE_URL);
  return raw.replace(/\/+$/, '');
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
  readToken: process.env.SANITY_API_READ_TOKEN ?? '',
  writeToken: process.env.SANITY_API_WRITE_TOKEN ?? '',
  revalidateSecret: process.env.SANITY_REVALIDATE_SECRET ?? '',
};

/** True when content should come from Sanity rather than the seed files. */
export function isSanityConfigured(): boolean {
  return sanityConfig.projectId.trim().length > 0;
}

export const posthogConfig = {
  key: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY ?? '',
};

export function isPostHogConfigured(): boolean {
  return posthogConfig.key.trim().length > 0;
}

export const kitConfig = {
  apiKey: process.env.KIT_API_KEY ?? '',
  baseUrl: process.env.KIT_API_BASE_URL ?? 'https://api.kit.com/v4',
  tags: {
    hudsonDynasty: process.env.KIT_TAG_HUDSON_DYNASTY_ID ?? '',
    goldenParachute: process.env.KIT_TAG_GOLDEN_PARACHUTE_ID ?? '',
    bonusMorningAfter: process.env.KIT_TAG_BONUS_MORNING_AFTER_ID ?? '',
    sourceMeta: process.env.KIT_TAG_SOURCE_META_ID ?? '',
    sourceTiktok: process.env.KIT_TAG_SOURCE_TIKTOK_ID ?? '',
    sourceBookbub: process.env.KIT_TAG_SOURCE_BOOKBUB_ID ?? '',
    existingReader: process.env.KIT_TAG_EXISTING_READER_ID ?? '',
  },
};

export function isKitConfigured(): boolean {
  return kitConfig.apiKey.trim().length > 0;
}

export function amazonDefaultMarketplace(): string {
  return process.env.AMAZON_DEFAULT_MARKETPLACE ?? 'https://www.amazon.com';
}
