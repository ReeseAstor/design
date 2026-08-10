import { describe, expect, it } from 'vitest';
import { evaluatePublication } from '@/lib/publication/guard';
import { seedBookBySlug, seedCampaignById, seedLandingPage } from '@/lib/content/seed';
import {
  makeAttributionLink,
  makeBook,
  makeCampaign,
  makeFormat,
  makeLandingPage,
} from '@/tests/fixtures/content';

const codes = (result: ReturnType<typeof evaluatePublication>) =>
  result.failures.map((failure) => failure.code);

describe('publication guard', () => {
  it('publishes when every ingredient of a purchase exists', () => {
    const result = evaluatePublication({
      landingPage: makeLandingPage(),
      book: makeBook(),
      campaign: makeCampaign(),
      format: 'ebook',
      variant: 'control',
    });

    expect(result.publishable).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('blocks Golden Parachute: no ASIN, no destination, no approved cover', () => {
    const book = seedBookBySlug('golden-parachute');
    const campaign = seedCampaignById('GP_ORGANIC');
    const landingPage = seedLandingPage('GP_ORGANIC');

    const result = evaluatePublication({
      landingPage,
      book,
      campaign,
      format: 'ebook',
      variant: 'control',
    });

    expect(result.publishable).toBe(false);
    expect(codes(result)).toContain('cover_missing');
    expect(codes(result)).toContain('destination_missing');
  });

  it('blocks a paid campaign that has no variant-specific attribution URL', () => {
    const result = evaluatePublication({
      landingPage: makeLandingPage(),
      book: makeBook(),
      campaign: makeCampaign({
        campaignId: 'GP_META_FORCEDPROX',
        trafficSource: 'meta',
        attributionLinks: [],
      }),
      format: 'ebook',
      variant: 'control',
    });

    expect(result.publishable).toBe(false);
    expect(codes(result)).toContain('attribution_url_missing');
  });

  it('publishes a paid campaign once its attribution URL is configured', () => {
    const result = evaluatePublication({
      landingPage: makeLandingPage(),
      book: makeBook(),
      campaign: makeCampaign({
        campaignId: 'GP_META_FORCEDPROX',
        trafficSource: 'meta',
        attributionLinks: [makeAttributionLink()],
      }),
      format: 'ebook',
      variant: 'control',
    });

    expect(result.publishable).toBe(true);
  });

  it('blocks on a missing cover even when the destination is fine', () => {
    const result = evaluatePublication({
      landingPage: makeLandingPage(),
      book: makeBook({ formats: [makeFormat({ coverAsset: null })] }),
      campaign: makeCampaign(),
      format: 'ebook',
      variant: 'control',
    });

    expect(result.publishable).toBe(false);
    expect(codes(result)).toEqual(['cover_missing']);
  });

  it('blocks on a missing price, headline or CTA label', () => {
    expect(
      codes(
        evaluatePublication({
          landingPage: makeLandingPage(),
          book: makeBook({ formats: [makeFormat({ priceUsd: null })] }),
          campaign: makeCampaign(),
          format: 'ebook',
          variant: 'control',
        }),
      ),
    ).toContain('price_missing');

    expect(
      codes(
        evaluatePublication({
          landingPage: makeLandingPage({ headline: '   ' }),
          book: makeBook(),
          campaign: makeCampaign(),
          format: 'ebook',
          variant: 'control',
        }),
      ),
    ).toContain('headline_missing');

    expect(
      codes(
        evaluatePublication({
          landingPage: makeLandingPage({ ctaLabel: '' }),
          book: makeBook(),
          campaign: makeCampaign(),
          format: 'ebook',
          variant: 'control',
        }),
      ),
    ).toContain('cta_missing');
  });

  it('blocks an inactive campaign and one outside its scheduled window', () => {
    expect(
      codes(
        evaluatePublication({
          landingPage: makeLandingPage(),
          book: makeBook(),
          campaign: makeCampaign({ active: false }),
          format: 'ebook',
          variant: 'control',
        }),
      ),
    ).toContain('campaign_inactive');

    expect(
      codes(
        evaluatePublication({
          landingPage: makeLandingPage(),
          book: makeBook(),
          campaign: makeCampaign({ endsAt: '2026-01-01T00:00:00.000Z' }),
          format: 'ebook',
          variant: 'control',
          now: new Date('2026-08-10T00:00:00.000Z'),
        }),
      ),
    ).toContain('campaign_window_closed');
  });
});
