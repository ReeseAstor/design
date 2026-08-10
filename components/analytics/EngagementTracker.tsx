'use client';

/**
 * Funnel state for a single landing session.
 *
 * Two jobs:
 *   1. Fire `landing_view` and `experiment_exposure` once, on mount.
 *   2. Watch scroll depth and *active* time, and reveal the inline recovery
 *      offer exactly once when the high-engagement threshold is crossed.
 *
 * Active time is counted only while the tab is visible. A phone left face-down
 * on a table for a minute is not an engaged reader, and treating it as one would
 * inflate the recovery module's apparent performance.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { captureEvent } from '@/components/analytics/PostHogProvider';
import { COOKIE_RETURNING_READER } from '@/lib/cookies';
import { readClientCookie } from '@/lib/cookies/client';
import { isHighEngagement } from '@/lib/posthog/engagement';
import { deviceTypeFromWidth, readUtmParameters } from '@/lib/posthog/events';
import type { CtaPlacement, TrafficSource } from '@/lib/content/types';

interface EngagementTrackerProps {
  campaignId: string;
  bookSlug: string;
  trafficSource: TrafficSource | null;
  experimentKey: string | null;
  variant: string;
  bookFormat: string;
  /** Rendered when the high-engagement threshold is crossed. */
  recoverySlot: React.ReactNode;
  /** Rendered immediately for a reader who already clicked through to Amazon. */
  returningSlot: React.ReactNode;
  initialReturningReader: boolean;
}

const TICK_MS = 1000;

export function EngagementTracker({
  campaignId,
  bookSlug,
  trafficSource,
  experimentKey,
  variant,
  bookFormat,
  recoverySlot,
  returningSlot,
  initialReturningReader,
}: EngagementTrackerProps) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [returningReader, setReturningReader] = useState(initialReturningReader);

  const amazonClicked = useRef(false);
  const scrollDepth = useRef(0);
  const activeSeconds = useRef(0);
  const revealed = useRef(false);
  const fired = useRef(false);

  const commonProperties = useCallback(
    () => ({
      campaign_id: campaignId,
      book_id: bookSlug,
      traffic_source: trafficSource,
      experiment_key: experimentKey,
      experiment_variant: variant,
      landing_variant: variant,
      book_format: bookFormat,
      device_type: typeof window === 'undefined' ? null : deviceTypeFromWidth(window.innerWidth),
      ...readUtmParameters(typeof window === 'undefined' ? '' : window.location.search),
    }),
    [campaignId, bookSlug, trafficSource, experimentKey, variant, bookFormat],
  );

  // landing_view + experiment_exposure, once per page load.
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const returning = readClientCookie(COOKIE_RETURNING_READER) !== null;
    if (returning) setReturningReader(true);

    captureEvent('landing_view', {
      ...commonProperties(),
      cta_location: null satisfies CtaPlacement | null,
      returning_reader: returning || initialReturningReader,
    });

    if (experimentKey) {
      captureEvent('experiment_exposure', {
        ...commonProperties(),
        // PostHog's experiment reporting keys off these two property names.
        $feature_flag: experimentKey,
        $feature_flag_response: variant,
      });
    }
  }, [commonProperties, experimentKey, variant, initialReturningReader]);

  // A click on any Buy button ends recovery eligibility for the session.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-cta-placement]')) {
        amazonClicked.current = true;
        setShowRecovery(false);
      }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    const evaluate = () => {
      if (revealed.current) return;
      const state = {
        amazonClicked: amazonClicked.current,
        scrollDepth: scrollDepth.current,
        activeTimeSeconds: activeSeconds.current,
      };
      if (isHighEngagement(state)) {
        revealed.current = true;
        setShowRecovery(true);
      }
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const depth = scrollable <= 0 ? 1 : (window.scrollY + window.innerHeight) / doc.scrollHeight;
      scrollDepth.current = Math.max(scrollDepth.current, Math.min(depth, 1));
      evaluate();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        activeSeconds.current += TICK_MS / 1000;
        evaluate();
      }
    }, TICK_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      {returningReader ? <div data-testid="returning-reader-offer">{returningSlot}</div> : null}
      {showRecovery && !returningReader ? (
        <div data-testid="recovery-offer">{recoverySlot}</div>
      ) : null}
    </>
  );
}
