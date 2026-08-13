'use client';

/**
 * Every purchase CTA on the site is this component.
 *
 * It renders an anchor to the internal `/go/` route — never an amazon.com URL —
 * so that no visual component can leak a destination, and so that a click is
 * always recorded server-side before the reader leaves.
 *
 * The client-side capture here is a convenience duplicate for funnel views in
 * PostHog; the redirect handler is the record of truth.
 */

import { captureEvent } from '@/components/analytics/PostHogProvider';
import { buildGoHref } from '@/lib/validation/redirect';
import type { CtaPlacement, TrafficSource } from '@/lib/content/types';
import { deviceTypeFromWidth } from '@/lib/posthog/events';

export interface BuyButtonProps {
  bookSlug: string;
  bookTitle: string;
  campaignId: string;
  placement: CtaPlacement;
  variant: string;
  experimentKey: string | null;
  trafficSource: TrafficSource | null;
  format?: string;
  label: string;
  supportingLine?: string;
  /** `book0` fires the dedicated series-entry event instead of `amazon_click`. */
  intent?: 'primary' | 'book0';
  tone?: 'gold' | 'outline';
  fullWidth?: boolean;
  className?: string;
}

export function BuyButton({
  bookSlug,
  bookTitle,
  campaignId,
  placement,
  variant,
  experimentKey,
  trafficSource,
  format = 'ebook',
  label,
  supportingLine,
  intent = 'primary',
  tone = 'gold',
  fullWidth = true,
  className = '',
}: BuyButtonProps) {
  const href = buildGoHref({ bookSlug, campaignId, placement, variant, format });

  const onClick = () => {
    captureEvent(intent === 'book0' ? 'book0_click' : 'amazon_click', {
      campaign_id: campaignId,
      book_id: bookSlug,
      traffic_source: trafficSource,
      cta_location: placement,
      book_format: format,
      experiment_key: experimentKey,
      experiment_variant: variant,
      landing_variant: variant,
      device_type: typeof window === 'undefined' ? null : deviceTypeFromWidth(window.innerWidth),
      capture_surface: 'client',
    });
  };

  const base =
    'tap-target inline-flex items-center justify-center rounded-sm px-6 py-4 text-center text-[0.95rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-150 motion-reduce:transition-none';

  const tones = {
    gold: 'bg-gold text-charcoal hover:bg-gold-bright active:bg-gold-bright',
    outline:
      'border border-gold/70 bg-transparent text-gold-bright hover:bg-gold/12 active:bg-gold/20',
  } as const;

  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      <a
        href={href}
        onClick={onClick}
        data-cta-placement={placement}
        data-cta-intent={intent}
        className={`${base} ${tones[tone]} ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {label}
      </a>
      {supportingLine ? (
        <p className="mt-2.5 text-center text-sm text-ink-muted">{supportingLine}</p>
      ) : null}
    </div>
  );
}
