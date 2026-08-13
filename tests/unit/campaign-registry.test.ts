import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_DEFINITIONS,
  findCampaignById,
  findCampaignBySlug,
  isKnownCampaignId,
  ORGANIC_CAMPAIGN_ID,
} from '@/lib/campaigns/registry';
import { seedBookList, normaliseKuEnabled } from '@/lib/content/seed';
import { COOKIE_AMAZON_CLICK, parseAmazonClickValue, serializeAmazonClickValue } from '@/lib/cookies';

describe('campaign registry', () => {
  it('holds exactly the five specified campaigns with their routes', () => {
    expect(
      CAMPAIGN_DEFINITIONS.map((c) => [c.campaignId, c.route, c.trafficSource, c.seoIndexable]),
    ).toEqual([
      ['GP_ORGANIC', '/golden-parachute', 'organic', true],
      ['GP_META_FORCEDPROX', '/gp/meta-forced-proximity', 'meta', false],
      ['GP_TIKTOK_KAI', '/gp/tiktok-kai', 'tiktok', false],
      ['GP_BOOKBUB_BILLIONAIRE', '/gp/bookbub-billionaire', 'bookbub', false],
      ['GP_NEWSLETTER_EXISTING', '/gp/newsletter', 'newsletter', false],
    ]);
  });

  it('requires an attribution URL for every paid campaign and not for organic', () => {
    for (const definition of CAMPAIGN_DEFINITIONS) {
      expect(definition.requiresAttributionUrl, definition.campaignId).toBe(
        definition.trafficSource !== 'organic',
      );
    }
  });

  it('looks campaigns up by ID and by slug', () => {
    expect(findCampaignById(ORGANIC_CAMPAIGN_ID)?.route).toBe('/golden-parachute');
    expect(findCampaignBySlug('tiktok-kai')?.campaignId).toBe('GP_TIKTOK_KAI');
    expect(findCampaignById('GP_UNKNOWN')).toBeNull();
    expect(findCampaignBySlug(null)).toBeNull();
    expect(isKnownCampaignId('GP_UNKNOWN')).toBe(false);
  });
});

describe('catalog seed integrity', () => {
  const books = seedBookList();

  it('carries all nine supplied titles and 24 live cover records', () => {
    expect(books).toHaveLength(9);

    const liveCovers = books
      .filter((book) => book.publicationStatus === 'live')
      .flatMap((book) => book.formats)
      .filter((format) => format.coverSourceUrl !== null);

    expect(liveCovers).toHaveLength(24);
  });

  it('never marks a paperback or audiobook as Kindle Unlimited', () => {
    for (const book of books) {
      for (const format of book.formats) {
        if (format.format !== 'ebook') {
          expect(format.kuEnabled, `${book.slug}:${format.format}`).toBe(false);
        }
      }
    }

    expect(normaliseKuEnabled('paperback', true)).toBe(false);
    expect(normaliseKuEnabled('audiobook', true)).toBe(false);
    expect(normaliseKuEnabled('ebook', true)).toBe(true);
  });

  it('leaves Golden Parachute without an ASIN, product URL or cover', () => {
    const gp = books.find((book) => book.slug === 'golden-parachute');
    expect(gp?.publicationStatus).toBe('prelaunch');

    const ebook = gp?.formats.find((format) => format.format === 'ebook');
    expect(ebook?.asin).toBeNull();
    expect(ebook?.amazonProductUrl).toBeNull();
    expect(ebook?.coverSourceUrl).toBeNull();
    expect(ebook?.coverAsset).toBeNull();
    expect(ebook?.priceUsd).toBe(4.99);
    expect(ebook?.kuEnabled).toBe(true);
  });

  it('keeps the supplied Book 0 destination exactly as given', () => {
    const bookZero = books.find((book) => book.slug === 'the-first-acquisition');
    const ebook = bookZero?.formats.find((format) => format.format === 'ebook');
    expect(ebook?.amazonProductUrl).toBe('https://www.amazon.com/dp/B0D82GWFD9');
    expect(ebook?.priceUsd).toBe(0.99);
  });
});

describe('returning-reader cookie', () => {
  it('round-trips a book slug and timestamp', () => {
    const at = new Date('2026-08-10T12:00:00.000Z');
    const value = serializeAmazonClickValue('golden-parachute', at);

    expect(value).toBe(`golden-parachute:${Math.floor(at.getTime() / 1000)}`);

    const parsed = parseAmazonClickValue(value);
    expect(parsed?.bookSlug).toBe('golden-parachute');
    expect(parsed?.clickedAt.toISOString()).toBe(at.toISOString());
  });

  it('rejects malformed values rather than guessing', () => {
    for (const value of ['', 'golden-parachute', ':123', 'golden-parachute:abc', null, undefined]) {
      expect(parseAmazonClickValue(value), String(value)).toBeNull();
    }
  });

  it('uses the specified cookie name', () => {
    expect(COOKIE_AMAZON_CLICK).toBe('ra_amazon_click');
  });
});
