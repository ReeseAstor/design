import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConversionPage } from '@/components/conversion/ConversionPage';
import { CAMPAIGN_DEFINITIONS, findCampaignBySlug } from '@/lib/campaigns/registry';
import { conversionMetadata, prepareConversionPage } from '@/lib/conversion/render';
import { GP_SEO_DESCRIPTION, GP_SEO_TITLE } from '@/lib/content/golden-parachute';

/**
 * Paid campaign landing pages.
 *
 * Identical offer, identical section order, different campaign binding — that is
 * the point. They are noindex/follow and canonicalise to /golden-parachute, and
 * they render no navigation above the first CTA.
 */

export function generateStaticParams() {
  return CAMPAIGN_DEFINITIONS.filter((c) => c.trafficSource !== 'organic').map((c) => ({
    campaignSlug: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignSlug: string }>;
}): Promise<Metadata> {
  const { campaignSlug } = await params;
  const definition = findCampaignBySlug(campaignSlug);
  if (!definition || definition.trafficSource === 'organic') return {};

  return conversionMetadata(definition.campaignId, {
    title: GP_SEO_TITLE,
    description: GP_SEO_DESCRIPTION,
    indexable: false,
  });
}

export default async function CampaignLandingPage({
  params,
}: {
  params: Promise<{ campaignSlug: string }>;
}) {
  const { campaignSlug } = await params;
  const definition = findCampaignBySlug(campaignSlug);

  // /gp/golden-parachute is not a route: the organic page lives at its own URL.
  if (!definition || definition.trafficSource === 'organic') notFound();

  const model = await prepareConversionPage(definition.campaignId);
  if (!model) notFound();

  return <ConversionPage landingPage={model} />;
}
