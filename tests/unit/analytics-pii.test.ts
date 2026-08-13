import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  containsPii,
  deviceTypeFromWidth,
  readUtmParameters,
  sanitizeEventProperties,
} from '@/lib/posthog/events';

describe('analytics PII guard', () => {
  it('strips every forbidden key', () => {
    const { properties, removed } = sanitizeEventProperties({
      campaign_id: 'GP_META_FORCEDPROX',
      email: 'reader@example.com',
      first_name: 'Miri',
      last_name: 'Doyle-Levine',
      phone: '+1 555 0100',
      purchase_status: 'purchased',
      amazon_customer_id: 'A123',
      health_status: 'sepsis',
    });

    expect(properties).toEqual({ campaign_id: 'GP_META_FORCEDPROX' });
    expect(removed).toContain('email');
    expect(removed).toContain('first_name');
    expect(removed).toContain('purchase_status');
    expect(removed).toContain('amazon_customer_id');
    expect(removed).toContain('health_status');
  });

  it('strips an email address hiding under an innocuous key', () => {
    const { properties } = sanitizeEventProperties({
      campaign_id: 'GP_ORGANIC',
      reader_reference: 'someone@example.com',
    });

    expect(properties.reader_reference).toBeUndefined();
    expect(properties.campaign_id).toBe('GP_ORGANIC');
  });

  it('refuses whole nested objects, which is how a form payload leaks', () => {
    const { properties, removed } = sanitizeEventProperties({
      campaign_id: 'GP_ORGANIC',
      form: { email: 'reader@example.com' },
      values: { a: 1 },
    });

    expect(properties).toEqual({ campaign_id: 'GP_ORGANIC' });
    expect(removed).toEqual(expect.arrayContaining(['form', 'values']));
  });

  it('keeps the documented common properties intact', () => {
    const input = {
      campaign_id: 'GP_TIKTOK_KAI',
      book_id: 'golden-parachute',
      traffic_source: 'tiktok',
      utm_source: 'tiktok',
      utm_medium: 'paid_social',
      utm_campaign: 'kai',
      utm_content: 'hook_a',
      landing_variant: 'ku_first',
      experiment_key: 'gp_hero_value_proposition',
      experiment_variant: 'ku_first',
      cta_location: 'sticky_mobile',
      book_format: 'ebook',
      device_type: 'mobile',
    } as const;

    const { properties, removed } = sanitizeEventProperties(input);
    expect(properties).toEqual(input);
    expect(removed).toEqual([]);
    expect(containsPii(input)).toBe(false);
  });

  it('exposes exactly the seven contracted events', () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
      'landing_view',
      'amazon_click',
      'book0_click',
      'newsletter_view',
      'newsletter_subscribed',
      'review_click',
      'experiment_exposure',
    ]);
  });
});

describe('analytics helpers', () => {
  it('buckets device type by viewport width', () => {
    expect(deviceTypeFromWidth(320)).toBe('mobile');
    expect(deviceTypeFromWidth(768)).toBe('tablet');
    expect(deviceTypeFromWidth(1440)).toBe('desktop');
  });

  it('reads UTM parameters, returning null for absent ones', () => {
    expect(readUtmParameters('?utm_source=meta&utm_campaign=forcedprox')).toEqual({
      utm_source: 'meta',
      utm_medium: null,
      utm_campaign: 'forcedprox',
      utm_content: null,
    });
  });
});
