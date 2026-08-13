/**
 * Kit API V4 integration.
 *
 * Two calls: create/update the subscriber, then apply tags. Tag application is
 * best-effort — a subscriber who lands on the list without the `source_meta` tag
 * is a reporting gap, while a subscriber lost because a tag ID was misconfigured
 * is a lost reader.
 */

import 'server-only';
import { isKitConfigured, kitConfig } from '@/lib/config';
import type { TrafficSource } from '@/lib/content/types';

export interface KitSubscriberInput {
  email: string;
  firstName?: string;
  fields: KitCustomFields;
  tagIds: string[];
}

export interface KitCustomFields {
  source_campaign: string;
  source_channel: string;
  book_interest: string;
  bonus_offer: string;
  first_touch_url: string;
}

export type KitResult =
  | { ok: true; mode: 'live'; subscriberId: string | number | null; taggedCount: number }
  | { ok: true; mode: 'mock'; subscriberId: null; taggedCount: number }
  | { ok: false; status: number; message: string };

const SUBSCRIBE_TIMEOUT_MS = 8000;

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Kit-Api-Key': kitConfig.apiKey,
  };
}

async function kitRequest(path: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBSCRIBE_TIMEOUT_MS);
  try {
    return await fetch(`${kitConfig.baseUrl}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Maps a traffic source to its configured Kit tag, skipping unconfigured ones. */
export function resolveTagIds(options: {
  trafficSource: TrafficSource | null;
  bookInterest: string;
  offerId: string;
  isExistingReader: boolean;
}): string[] {
  const { tags } = kitConfig;
  const ids: Array<string | undefined> = [tags.hudsonDynasty];

  if (options.bookInterest === 'golden_parachute') ids.push(tags.goldenParachute);
  if (options.offerId === 'morning_after') ids.push(tags.bonusMorningAfter);
  if (options.trafficSource === 'meta') ids.push(tags.sourceMeta);
  if (options.trafficSource === 'tiktok') ids.push(tags.sourceTiktok);
  if (options.trafficSource === 'bookbub') ids.push(tags.sourceBookbub);
  if (options.isExistingReader || options.trafficSource === 'newsletter') {
    ids.push(tags.existingReader);
  }

  return [...new Set(ids.filter((id): id is string => Boolean(id && id.trim())))];
}

export async function subscribeToKit(input: KitSubscriberInput): Promise<KitResult> {
  if (!isKitConfigured()) {
    // Mock mode: the reader sees the same success state, and the operator sees a
    // clear log line rather than a silent drop.
    console.info(
      '[kit:mock] KIT_API_KEY is not set — subscriber not sent.',
      { fields: input.fields, tagIds: input.tagIds },
    );
    return { ok: true, mode: 'mock', subscriberId: null, taggedCount: input.tagIds.length };
  }

  let response: Response;
  try {
    response = await kitRequest('/subscribers', {
      email_address: input.email,
      first_name: input.firstName || undefined,
      state: 'active',
      fields: input.fields,
    });
  } catch (error) {
    console.error('[kit] subscriber request failed', error);
    return { ok: false, status: 502, message: 'We could not reach the reader list just now.' };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`[kit] subscriber create failed (${response.status})`, detail.slice(0, 500));
    return {
      ok: false,
      status: response.status === 422 ? 422 : 502,
      message:
        response.status === 422
          ? 'That email address was rejected by the reader list.'
          : 'We could not reach the reader list just now.',
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | { subscriber?: { id?: string | number; email_address?: string } }
    | null;
  const subscriberId = payload?.subscriber?.id ?? null;

  let taggedCount = 0;
  for (const tagId of input.tagIds) {
    try {
      const tagResponse = await kitRequest(`/tags/${encodeURIComponent(tagId)}/subscribers`, {
        email_address: input.email,
      });
      if (tagResponse.ok) {
        taggedCount += 1;
      } else {
        console.error(`[kit] tag ${tagId} failed with ${tagResponse.status}`);
      }
    } catch (error) {
      console.error(`[kit] tag ${tagId} request failed`, error);
    }
  }

  return { ok: true, mode: 'live', subscriberId, taggedCount };
}
