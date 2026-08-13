import 'server-only';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getLandingPageBundle } from '@/lib/content/source';
import { buildConversionViewModel, type ConversionViewModel } from './view-model';
import { assignVariant } from '@/lib/experiments/assignment';
import { EXPERIMENT_KEY } from '@/lib/experiments/definitions';
import { COOKIE_AMAZON_CLICK, COOKIE_ANON_ID, parseAmazonClickValue } from '@/lib/cookies';
import { absoluteUrl, siteUrl } from '@/lib/config';
import { findCampaignById } from '@/lib/campaigns/registry';

/**
 * Server-side page preparation shared by /golden-parachute and every /gp/ route.
 *
 * The variant is resolved here, before the first byte, so the CTA never changes
 * label after paint and the Buy button is usable immediately.
 */
export async function prepareConversionPage(
  campaignId: string,
): Promise<ConversionViewModel | null> {
  const bundle = await getLandingPageBundle(campaignId);
  if (!bundle) return null;

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(COOKIE_ANON_ID)?.value ?? null;
  const experimentKey = bundle.landingPage.experimentKey ?? EXPERIMENT_KEY;
  const variant = assignVariant(experimentKey, anonymousId);

  const click = parseAmazonClickValue(cookieStore.get(COOKIE_AMAZON_CLICK)?.value);

  return buildConversionViewModel({
    bundle,
    variant,
    // "Returning" means this browser previously clicked through to Amazon for
    // this book. It is never treated as evidence of a purchase.
    returningReader: click !== null && click.bookSlug === bundle.book.slug,
  });
}

export function conversionMetadata(
  campaignId: string,
  page: { title: string; description: string; indexable: boolean },
): Metadata {
  const definition = findCampaignById(campaignId);
  const canonical = absoluteUrl('/golden-parachute');
  const path = definition?.route ?? '/golden-parachute';

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    // Campaign pages are noindex/follow with a canonical back to the organic
    // page: the ad spend should not fragment the title's search presence.
    robots: page.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: 'book',
      title: page.title,
      description: page.description,
      url: `${siteUrl()}${path}`,
      siteName: 'Reese Astor',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  };
}
