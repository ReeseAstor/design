import { describe, expect, it } from 'vitest';
import { assignVariant, hashToUnitInterval, isValidAnonymousId } from '@/lib/experiments/assignment';
import { ctaCopyForVariant, EXPERIMENT_KEY, EXPERIMENT_VARIANTS } from '@/lib/experiments/definitions';
import { buildConversionViewModel } from '@/lib/conversion/view-model';
import { buildGoHref } from '@/lib/validation/redirect';
import {
  makeAttributionLink,
  makeBook,
  makeCampaign,
  makeLandingPage,
} from '@/tests/fixtures/content';

describe('experiment assignment', () => {
  it('is stable for the same anonymous ID', () => {
    const id = '0f3b0f0a-9f3e-4d1b-9a4d-2c3e4f5a6b7c';
    const first = assignVariant(EXPERIMENT_KEY, id);
    for (let i = 0; i < 20; i += 1) {
      expect(assignVariant(EXPERIMENT_KEY, id)).toBe(first);
    }
  });

  it('falls back to control with no anonymous ID', () => {
    expect(assignVariant(EXPERIMENT_KEY, null)).toBe('control');
    expect(assignVariant(EXPERIMENT_KEY, '')).toBe('control');
  });

  it('splits roughly evenly across a large population', () => {
    const counts = new Map<string, number>();
    const population = 4000;

    for (let i = 0; i < population; i += 1) {
      const variant = assignVariant(EXPERIMENT_KEY, `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
      counts.set(variant, (counts.get(variant) ?? 0) + 1);
    }

    expect(counts.size).toBe(EXPERIMENT_VARIANTS.length);
    for (const count of counts.values()) {
      const share = count / population;
      expect(share).toBeGreaterThan(0.4);
      expect(share).toBeLessThan(0.6);
    }
  });

  it('produces a value inside the unit interval', () => {
    for (const input of ['', 'a', 'gp_hero_value_proposition:abc', '🙂']) {
      const value = hashToUnitInterval(input);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('validates anonymous IDs', () => {
    expect(isValidAnonymousId('0f3b0f0a-9f3e-4d1b-9a4d-2c3e4f5a6b7c')).toBe(true);
    expect(isValidAnonymousId('not-a-uuid')).toBe(false);
    expect(isValidAnonymousId(null)).toBe(false);
  });
});

describe('experiment CTA copy', () => {
  it('renders the control value proposition', () => {
    const copy = ctaCopyForVariant('control', {
      priceUsd: 4.99,
      kuEnabled: true,
      title: 'Golden Parachute',
    });
    expect(copy.label).toBe('Read Golden Parachute — $4.99');
    expect(copy.supportingLine).toBe('Also available with Kindle Unlimited');
  });

  it('renders the Kindle Unlimited-first variant', () => {
    const copy = ctaCopyForVariant('ku_first', {
      priceUsd: 4.99,
      kuEnabled: true,
      title: 'Golden Parachute',
    });
    expect(copy.label).toBe('Read with Kindle Unlimited');
    expect(copy.supportingLine).toBe('Or buy the Kindle edition for $4.99');
  });

  it('does not offer Kindle Unlimited for a title that is not enrolled', () => {
    const copy = ctaCopyForVariant('ku_first', {
      priceUsd: 0.99,
      kuEnabled: false,
      title: 'The First Acquisition',
    });
    expect(copy.label).toBe('Read The First Acquisition — $0.99');
    expect(copy.supportingLine).toBe('');
  });
});

describe('variant propagation', () => {
  it('carries the assigned variant from the view model into the /go/ query', () => {
    const model = buildConversionViewModel({
      bundle: {
        landingPage: makeLandingPage(),
        book: makeBook(),
        campaign: makeCampaign({
          campaignId: 'GP_META_FORCEDPROX',
          trafficSource: 'meta',
          attributionLinks: [makeAttributionLink({ variant: 'ku_first' })],
        }),
        seriesEntryBook: null,
      },
      variant: 'ku_first',
      returningReader: false,
    });

    expect(model.variant).toBe('ku_first');
    expect(model.ctaLabel).toBe('Read with Kindle Unlimited');

    const href = buildGoHref({
      bookSlug: model.book.slug,
      campaignId: model.campaign.campaignId,
      placement: 'hero',
      variant: model.variant,
      format: model.format,
    });

    expect(new URLSearchParams(href.split('?')[1]).get('variant')).toBe('ku_first');
  });
});
