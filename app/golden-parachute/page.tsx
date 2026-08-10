import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConversionPage } from '@/components/conversion/ConversionPage';
import { ORGANIC_CAMPAIGN_ID } from '@/lib/campaigns/registry';
import { conversionMetadata, prepareConversionPage } from '@/lib/conversion/render';
import { GP_SEO_DESCRIPTION, GP_SEO_TITLE } from '@/lib/content/golden-parachute';
import { bookJsonLd, breadcrumbJsonLd, JsonLd } from '@/lib/seo/structured-data';

/**
 * The organic, indexable Golden Parachute page. Every campaign page canonicalises
 * back to this URL.
 */

export const metadata: Metadata = conversionMetadata(ORGANIC_CAMPAIGN_ID, {
  title: GP_SEO_TITLE,
  description: GP_SEO_DESCRIPTION,
  indexable: true,
});

export default async function GoldenParachutePage() {
  const model = await prepareConversionPage(ORGANIC_CAMPAIGN_ID);
  if (!model) notFound();

  return (
    <>
      <JsonLd data={bookJsonLd(model.book, model.formatRecord, '/golden-parachute')} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Reese Astor', path: '/' },
          { name: 'Hudson Dynasty', path: '/hudson-dynasty' },
          { name: model.book.title, path: '/golden-parachute' },
        ])}
      />
      <ConversionPage landingPage={model} />
    </>
  );
}
