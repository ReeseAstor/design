/**
 * Server-side capture.
 *
 * The `amazon_click` event is captured here, not in the browser, because it is
 * the event the primary KPI depends on: a click recorded server-side survives ad
 * blockers, a closing tab and a slow network, all of which are common on the
 * mobile traffic these campaigns buy.
 */

import 'server-only';
import { PostHog } from 'posthog-node';
import { isPostHogConfigured, posthogConfig } from '@/lib/config';
import { sanitizeEventProperties, type AnalyticsEvent, type EventProperties } from './events';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!isPostHogConfigured()) return null;
  client ??= new PostHog(posthogConfig.key, {
    host: posthogConfig.host,
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export interface ServerCaptureInput {
  event: AnalyticsEvent;
  distinctId: string;
  properties: EventProperties;
}

export async function captureServerEvent({
  event,
  distinctId,
  properties,
}: ServerCaptureInput): Promise<void> {
  const { properties: safeProperties, removed } = sanitizeEventProperties(properties);

  if (removed.length > 0) {
    console.warn(
      `[analytics] dropped ${removed.length} disallowed propert${removed.length === 1 ? 'y' : 'ies'} from ${event}: ${removed.join(', ')}`,
    );
  }

  const posthog = getClient();
  if (!posthog) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[analytics:noop] ${event}`, safeProperties);
    }
    return;
  }

  posthog.capture({
    distinctId,
    event,
    properties: { ...safeProperties, $process_person_profile: false },
  });

  // Route handlers on serverless runtimes are frozen the moment the response is
  // returned, so the event has to be on the wire before the redirect is sent.
  await posthog.flush().catch((error: unknown) => {
    console.error('[analytics] flush failed', error);
  });
}

export async function shutdownPostHog(): Promise<void> {
  if (!client) return;
  await client.shutdown();
  client = null;
}
