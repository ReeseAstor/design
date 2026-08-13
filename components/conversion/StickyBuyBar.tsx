'use client';

/**
 * The mobile sticky purchase bar.
 *
 * It appears only after the hero CTA has scrolled out of view, so there is never
 * a moment where two identical buttons compete. The page reserves matching
 * bottom padding, and the bar respects `env(safe-area-inset-bottom)`, so it does
 * not sit on top of content or under a phone's home indicator.
 */

import { useEffect, useState } from 'react';
import { BuyButton } from './BuyButton';
import { formatPrice } from '@/lib/conversion/view-model';
import type { TrafficSource } from '@/lib/content/types';

export interface StickyBuyBarProps {
  bookSlug: string;
  bookTitle: string;
  campaignId: string;
  variant: string;
  experimentKey: string | null;
  trafficSource: TrafficSource | null;
  format: string;
  priceUsd: number | null;
  kuEnabled: boolean;
  /** Book 0 fires the series-entry event rather than amazon_click. */
  intent?: 'primary' | 'book0';
}

export function StickyBuyBar({
  bookSlug,
  bookTitle,
  campaignId,
  variant,
  experimentKey,
  trafficSource,
  format,
  priceUsd,
  kuEnabled,
  intent = 'primary',
}: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector('[data-cta-placement="hero"]');
    if (!target) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(!entry.isIntersecting);
      },
      { rootMargin: '0px 0px -8px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const price = formatPrice(priceUsd);

  return (
    <div
      data-testid="sticky-buy-bar"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-charcoal/97 backdrop-blur-[2px] transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-4 px-4 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.05rem] leading-tight text-ivory">
            {bookTitle}
          </p>
          <p className="truncate text-[0.78rem] text-ink-muted">
            {price ?? ''}
            {price && kuEnabled ? ' · ' : ''}
            {kuEnabled ? 'Kindle Unlimited' : ''}
          </p>
        </div>

        <div className="shrink-0 basis-[58%]">
          <BuyButton
            bookSlug={bookSlug}
            bookTitle={bookTitle}
            campaignId={campaignId}
            placement="sticky_mobile"
            variant={variant}
            experimentKey={experimentKey}
            trafficSource={trafficSource}
            format={format}
            intent={intent}
            label={variant === 'ku_first' && kuEnabled ? 'Read on KU' : 'Read now'}
            className="!px-4 !py-3.5 !text-[0.82rem] !tracking-[0.1em]"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Reserves the space the bar occupies so the last section of a page is never
 * trapped beneath it.
 */
export const STICKY_BAR_CLEARANCE =
  'calc(var(--sticky-bar-height) + env(safe-area-inset-bottom, 0px))';
