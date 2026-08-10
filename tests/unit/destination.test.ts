import { describe, expect, it } from 'vitest';
import { resolveAmazonDestination } from '@/lib/amazon/destination';
import {
  makeAttributionLink,
  makeBook,
  makeCampaign,
  makeFormat,
} from '@/tests/fixtures/content';
import { EXPERIMENT_KEY } from '@/lib/experiments/definitions';

describe('destination resolution', () => {
  it('prefers the variant-specific attribution URL', () => {
    const campaign = makeCampaign({
      campaignId: 'GP_META_FORCEDPROX',
      trafficSource: 'meta',
      attributionLinks: [
        makeAttributionLink({
          variant: 'control',
          amazonAttributionUrl: 'https://www.amazon.com/dp/B0H1F9PV97?maas=control',
        }),
        makeAttributionLink({
          variant: 'ku_first',
          amazonAttributionUrl: 'https://www.amazon.com/dp/B0H1F9PV97?maas=ku',
        }),
      ],
    });

    const result = resolveAmazonDestination({
      book: makeBook(),
      campaign,
      format: 'ebook',
      variant: 'ku_first',
      experimentKey: EXPERIMENT_KEY,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe('attribution_variant');
      expect(result.url).toContain('maas=ku');
    }
  });

  it('falls back to the product URL for organic traffic only', () => {
    const organic = resolveAmazonDestination({
      book: makeBook(),
      campaign: makeCampaign(),
      format: 'ebook',
      variant: 'control',
      experimentKey: EXPERIMENT_KEY,
    });

    expect(organic.ok).toBe(true);
    if (organic.ok) {
      expect(organic.kind).toBe('product_url');
      expect(organic.url).toBe('https://www.amazon.com/dp/B0H1F9PV97');
    }
  });

  it('refuses to send paid traffic to an unattributed product URL', () => {
    const paid = resolveAmazonDestination({
      book: makeBook(),
      campaign: makeCampaign({
        campaignId: 'GP_TIKTOK_KAI',
        trafficSource: 'tiktok',
        attributionLinks: [],
      }),
      format: 'ebook',
      variant: 'control',
      experimentKey: EXPERIMENT_KEY,
    });

    expect(paid.ok).toBe(false);
    if (!paid.ok) expect(paid.reason).toBe('attribution_required');
  });

  it('rejects a non-Amazon attribution URL even when an editor saved one', () => {
    const result = resolveAmazonDestination({
      book: makeBook(),
      campaign: makeCampaign({
        campaignId: 'GP_BOOKBUB_BILLIONAIRE',
        trafficSource: 'bookbub',
        attributionLinks: [
          makeAttributionLink({ amazonAttributionUrl: 'https://arbitrary-domain.example/dp/X' }),
        ],
      }),
      format: 'ebook',
      variant: 'control',
      experimentKey: EXPERIMENT_KEY,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('destination_not_allowlisted');
  });

  it('reports a missing destination for a prelaunch title', () => {
    const goldenParachute = makeBook({
      publicationStatus: 'prelaunch',
      formats: [makeFormat({ asin: null, amazonProductUrl: null, coverAsset: null })],
    });

    const result = resolveAmazonDestination({
      book: goldenParachute,
      campaign: makeCampaign(),
      format: 'ebook',
      variant: 'control',
      experimentKey: EXPERIMENT_KEY,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no_destination_configured');
  });

  it('will not resolve an inactive or missing format', () => {
    const inactive = resolveAmazonDestination({
      book: makeBook({ formats: [makeFormat({ active: false })] }),
      campaign: makeCampaign(),
      format: 'ebook',
      variant: 'control',
      experimentKey: null,
    });
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) expect(inactive.reason).toBe('format_inactive');

    const missing = resolveAmazonDestination({
      book: makeBook(),
      campaign: makeCampaign(),
      format: 'audiobook',
      variant: 'control',
      experimentKey: null,
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe('format_not_found');
  });
});
