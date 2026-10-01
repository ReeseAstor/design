import { NextResponse, type NextRequest } from 'next/server';
import { resolveGroupIds, subscribeToMailerLite } from '@/lib/mailerlite/client';
import { normaliseSourceUrl, validateNewsletterPayload } from '@/lib/validation/newsletter';
import { findCampaignById } from '@/lib/campaigns/registry';
import { captureServerEvent } from '@/lib/posthog/server';
import { COOKIE_AMAZON_CLICK, COOKIE_ANON_ID, parseAmazonClickValue } from '@/lib/cookies';

/**
 * POST /api/newsletter
 *
 * Validates, rejects without consent, screens the honeypot, writes to MailerLite,
 * applies source/interest groups, and captures a PII-free analytics event.
 *
 * The email address reaches MailerLite and nowhere else. It is never placed in an
 * analytics property, a log line, or a response body.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'We could not read that submission.' },
      { status: 400 },
    );
  }

  const validation = validateNewsletterPayload(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, message: validation.message, fieldErrors: validation.fieldErrors },
      { status: validation.status },
    );
  }

  const payload = validation.value;
  const campaignId = payload.campaign_id || '';
  const definition = findCampaignById(campaignId);
  const sourceUrl = normaliseSourceUrl(payload.source_url);

  const click = parseAmazonClickValue(request.cookies.get(COOKIE_AMAZON_CLICK)?.value);

  const groupIds = resolveGroupIds({
    trafficSource: definition?.trafficSource ?? null,
    bookInterest: payload.book_interest || '',
    offerId: payload.offer_id || '',
    isExistingReader: click !== null,
  });

  const result = await subscribeToMailerLite({
    email: payload.email,
    firstName: payload.first_name || undefined,
    fields: {
      source_campaign: campaignId,
      source_channel: definition?.trafficSource ?? 'direct',
      book_interest: payload.book_interest || '',
      bonus_offer: payload.offer_id || '',
      first_touch_url: sourceUrl,
    },
    groupIds,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
  }

  await captureServerEvent({
    event: 'newsletter_subscribed',
    distinctId: request.cookies.get(COOKIE_ANON_ID)?.value ?? crypto.randomUUID(),
    properties: {
      campaign_id: campaignId,
      book_id: payload.book_interest || '',
      traffic_source: definition?.trafficSource ?? null,
      offer_id: payload.offer_id || '',
      source_url: sourceUrl,
      mailerlite_mode: result.mode,
      groups_applied: result.groupCount,
      capture_surface: 'server',
    },
  });

  return NextResponse.json(
    {
      ok: true,
      message: "You're on the list. Check your inbox for a confirmation from Reese.",
    },
    { status: 201 },
  );
}
