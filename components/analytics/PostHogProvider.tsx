'use client';

/**
 * PostHog bootstrap.
 *
 * Autocapture and automatic pageviews are off. Everything this site measures is
 * an explicit event with a typed property bag, because the funnel is judged on
 * attributable revenue and not on incidental interaction volume.
 *
 * The distinct ID is the first-party `ra_aid` cookie that also drives experiment
 * bucketing, so what PostHog attributes matches what the server rendered.
 */

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { COOKIE_ANON_ID } from '@/lib/cookies';
import { readClientCookie } from '@/lib/cookies/client';
import { sanitizeEventProperties, type AnalyticsEvent, type EventProperties } from '@/lib/posthog/events';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let initialised = false;

function initPostHog(): void {
  if (initialised || !POSTHOG_KEY || typeof window === 'undefined') return;
  initialised = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    person_profiles: 'identified_only',
    persistence: 'localStorage+cookie',
  });

  const anonId = readClientCookie(COOKIE_ANON_ID);
  if (anonId) posthog.identify(anonId);
}

/**
 * The single client-side capture entry point. Sanitising here rather than at
 * each call site means no component can send a reader's email address even by
 * spreading a form object into the property bag.
 */
export function captureEvent(event: AnalyticsEvent, properties: EventProperties = {}): void {
  const { properties: safe, removed } = sanitizeEventProperties(properties);

  if (removed.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`[analytics] dropped disallowed properties from ${event}: ${removed.join(', ')}`);
  }

  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[analytics:noop] ${event}`, safe);
    }
    // Exposed for the end-to-end suite, which asserts on the event contract
    // without needing a PostHog project.
    recordForTests(event, safe);
    return;
  }

  recordForTests(event, safe);
  posthog.capture(event, safe);
}

declare global {
  interface Window {
    __raAnalytics?: Array<{ event: string; properties: Record<string, unknown> }>;
  }
}

function recordForTests(event: string, properties: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.__raAnalytics ??= [];
  window.__raAnalytics.push({ event, properties });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    initPostHog();
  }, []);

  return <>{children}</>;
}
