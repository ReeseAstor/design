/**
 * MailerLite API integration for the reader list.
 *
 * Without MAILERLITE_API_TOKEN the route validates and returns success in mock
 * mode so local/CI builds never break. Never invent or commit API tokens.
 */

import 'server-only';
import { isMailerLiteConfigured, mailerliteConfig } from '@/lib/config';
import type { TrafficSource } from '@/lib/content/types';

export interface MailerLiteSubscriberInput {
  email: string;
  firstName?: string;
  fields: MailerLiteCustomFields;
  groupIds: string[];
}

export interface MailerLiteCustomFields {
  source_campaign: string;
  source_channel: string;
  book_interest: string;
  bonus_offer: string;
  first_touch_url: string;
}

export type MailerLiteResult =
  | { ok: true; mode: 'live'; subscriberId: string | null; groupCount: number }
  | { ok: true; mode: 'mock'; subscriberId: null; groupCount: number }
  | { ok: false; status: number; message: string };

const SUBSCRIBE_TIMEOUT_MS = 8000;

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${mailerliteConfig.apiToken}`,
  };
}

async function mailerliteRequest(path: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBSCRIBE_TIMEOUT_MS);
  try {
    return await fetch(`${mailerliteConfig.baseUrl}${path}`, {
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

/** Maps traffic/offer context to configured MailerLite group IDs (skips blanks). */
export function resolveGroupIds(options: {
  trafficSource: TrafficSource | null;
  bookInterest: string;
  offerId: string;
  isExistingReader: boolean;
}): string[] {
  const { groups } = mailerliteConfig;
  const ids: Array<string | undefined> = [groups.hudsonDynasty, groups.default];

  if (options.bookInterest === 'golden_parachute') ids.push(groups.goldenParachute);
  if (options.bookInterest.includes('first_acquisition')) ids.push(groups.firstAcquisition);
  if (options.offerId === 'morning_after') ids.push(groups.bonusMorningAfter);
  if (options.trafficSource === 'meta') ids.push(groups.sourceMeta);
  if (options.trafficSource === 'tiktok') ids.push(groups.sourceTiktok);
  if (options.trafficSource === 'bookbub') ids.push(groups.sourceBookbub);
  if (options.isExistingReader || options.trafficSource === 'newsletter') {
    ids.push(groups.existingReader);
  }

  return [...new Set(ids.filter((id): id is string => Boolean(id && id.trim())))];
}

export async function subscribeToMailerLite(
  input: MailerLiteSubscriberInput,
): Promise<MailerLiteResult> {
  if (!isMailerLiteConfigured()) {
    console.info('[mailerlite:mock] MAILERLITE_API_TOKEN is not set — subscriber not sent.', {
      fields: input.fields,
      groupIds: input.groupIds,
    });
    return { ok: true, mode: 'mock', subscriberId: null, groupCount: input.groupIds.length };
  }

  let response: Response;
  try {
    response = await mailerliteRequest('/subscribers', {
      email: input.email,
      fields: {
        name: input.firstName || undefined,
        source_campaign: input.fields.source_campaign,
        source_channel: input.fields.source_channel,
        book_interest: input.fields.book_interest,
        bonus_offer: input.fields.bonus_offer,
        first_touch_url: input.fields.first_touch_url,
      },
      groups: input.groupIds.length > 0 ? input.groupIds : undefined,
      status: 'active',
    });
  } catch (error) {
    console.error('[mailerlite] subscriber request failed', error);
    return { ok: false, status: 502, message: 'We could not reach the reader list just now.' };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`[mailerlite] subscriber create failed (${response.status})`, detail.slice(0, 500));
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
    | { data?: { id?: string | number } }
    | null;
  const subscriberId =
    payload?.data?.id !== undefined && payload.data.id !== null ? String(payload.data.id) : null;

  return {
    ok: true,
    mode: 'live',
    subscriberId,
    groupCount: input.groupIds.length,
  };
}
