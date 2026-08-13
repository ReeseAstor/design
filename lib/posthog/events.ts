/**
 * The PostHog event contract.
 *
 * Events are explicit — there is no autocapture and no pageview autotracking —
 * because the KPI is attributable revenue per qualified session, and that is
 * reconstructed from a small number of well-typed events rather than from a
 * stream of DOM interactions.
 */

import type { CtaPlacement, TrafficSource } from '@/lib/content/types';

export const ANALYTICS_EVENTS = [
  'landing_view',
  'amazon_click',
  'book0_click',
  'newsletter_view',
  'newsletter_subscribed',
  'review_click',
  'experiment_exposure',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface CommonEventProperties {
  campaign_id: string;
  book_id: string;
  traffic_source: TrafficSource | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_variant: string | null;
  experiment_key: string | null;
  experiment_variant: string | null;
  cta_location: CtaPlacement | null;
  book_format: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | null;
}

export type EventProperties = Partial<CommonEventProperties> & Record<string, unknown>;

/**
 * Keys that must never reach PostHog. The check is on the key name and on the
 * shape of the value, so `{ email: '…' }` and `{ reader: 'a@b.com' }` are both
 * caught.
 */
const FORBIDDEN_KEYS = new Set([
  'email',
  'email_address',
  'emailaddress',
  'first_name',
  'firstname',
  'last_name',
  'lastname',
  'name',
  'full_name',
  'phone',
  'address',
  'payload',
  'form',
  'form_payload',
  'subscriber',
  'subscriber_id',
  'amazon_customer_id',
  'customer_id',
  'purchase_status',
  'purchased',
  'order_id',
  'health',
  'health_status',
  'diagnosis',
]);

const EMAIL_SHAPED = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;

export interface SanitizeResult {
  properties: Record<string, unknown>;
  removed: string[];
}

/**
 * Strips anything personally identifying before it can be captured. This runs on
 * every capture path — browser and server — so a future contributor adding a
 * property to a form handler cannot leak a reader's address by accident.
 */
export function sanitizeEventProperties(properties: EventProperties): SanitizeResult {
  const clean: Record<string, unknown> = {};
  const removed: string[] = [];

  for (const [key, value] of Object.entries(properties)) {
    const normalisedKey = key.toLowerCase().replace(/[\s-]/g, '_');

    if (FORBIDDEN_KEYS.has(normalisedKey)) {
      removed.push(key);
      continue;
    }
    if (typeof value === 'string' && EMAIL_SHAPED.test(value)) {
      removed.push(key);
      continue;
    }
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object') {
      // Nested objects are the easiest way to smuggle a whole form payload in.
      removed.push(key);
      continue;
    }

    clean[key] = value;
  }

  return { properties: clean, removed };
}

export function containsPii(properties: EventProperties): boolean {
  return sanitizeEventProperties(properties).removed.length > 0;
}

export function deviceTypeFromWidth(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function readUtmParameters(search: string): Pick<
  CommonEventProperties,
  'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content'
> {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
  };
}
