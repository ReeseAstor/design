import { NextResponse, type NextRequest } from 'next/server';
import { getBookBySlug, getCampaign, getLandingPage } from '@/lib/content/source';
import { resolveAmazonDestination } from '@/lib/amazon/destination';
import { validateRedirectRequest } from '@/lib/validation/redirect';
import { captureServerEvent } from '@/lib/posthog/server';
import {
  COOKIE_AMAZON_CLICK,
  COOKIE_ANON_ID,
  COOKIE_RETURNING_READER,
  amazonClickCookieOptions,
  returningReaderCookieOptions,
  serializeAmazonClickValue,
} from '@/lib/cookies';
import { deviceTypeFromWidth } from '@/lib/posthog/events';

/**
 * GET /go/[book]/amazon
 *
 * The only path from this site to Amazon. It takes no destination from the
 * caller — `?url=` does not exist and cannot be added without rewriting this
 * file — and it validates the request against closed sets before looking a
 * destination up from content.
 *
 * Steps, in order:
 *   1-5. Validate slug, campaign, placement, format and variant.
 *   6.   Load campaign and book.
 *   7.   Resolve the variant-specific Amazon Attribution URL.
 *   8.   Check the destination against the strict Amazon host allowlist.
 *   9.   Capture amazon_click server-side.
 *   10.  Set the returning-reader cookie.
 *   11.  307 to Amazon.
 */

export const dynamic = 'force-dynamic';

function configurationError(message: string, status = 404): NextResponse {
  console.error(`[go] ${message}`);
  return NextResponse.json(
    {
      error: 'destination_unavailable',
      message: 'This link is not available right now.',
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ book: string }> },
): Promise<NextResponse> {
  const { book: bookParam } = await context.params;
  const search = request.nextUrl.searchParams;

  // Steps 1-5: every reader-supplied value is matched against a closed set.
  const validation = validateRedirectRequest({
    book: bookParam,
    campaignId: search.get('c'),
    placement: search.get('placement'),
    variant: search.get('variant'),
    format: search.get('format'),
  });

  if (!validation.ok) {
    console.warn(`[go] rejected request: ${validation.errors.join('; ')}`);
    return NextResponse.json(
      { error: 'invalid_request', message: 'This link is not valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { book: bookSlug, campaignId, placement, variant, format } = validation.value;

  // Step 6: load from content. A slug that passed the regex still has to exist.
  const [book, campaign] = await Promise.all([getBookBySlug(bookSlug), getCampaign(campaignId)]);

  if (!book) return configurationError(`unknown book slug "${bookSlug}"`);
  if (!campaign) return configurationError(`unknown campaign "${campaignId}"`);

  if (!campaign.active) {
    return configurationError(`campaign "${campaignId}" is not active`, 410);
  }

  const landingPage = await getLandingPage(campaignId);

  // Steps 7-8: resolve, then allowlist. Both must pass.
  const destination = resolveAmazonDestination({
    book,
    campaign,
    format,
    variant,
    experimentKey: landingPage?.experimentKey ?? null,
  });

  if (!destination.ok) {
    return configurationError(
      `no usable destination for ${bookSlug}/${format} on ${campaignId} (variant ${variant}): ${destination.reason}${
        destination.detail ? ` [${destination.detail}]` : ''
      }`,
    );
  }

  // Step 9: server-side capture. This is the click of record for the KPI —
  // it survives ad blockers and a tab that closes mid-navigation.
  const anonymousId = request.cookies.get(COOKIE_ANON_ID)?.value ?? crypto.randomUUID();
  const viewportWidth = Number.parseInt(request.headers.get('sec-ch-viewport-width') ?? '', 10);

  await captureServerEvent({
    event: bookSlug === campaign.bookSlug ? 'amazon_click' : 'book0_click',
    distinctId: anonymousId,
    properties: {
      campaign_id: campaign.campaignId,
      book_id: book.slug,
      traffic_source: campaign.trafficSource,
      cta_location: placement,
      book_format: format,
      experiment_key: landingPage?.experimentKey ?? null,
      experiment_variant: variant,
      landing_variant: variant,
      destination_kind: destination.kind,
      utm_source: search.get('utm_source'),
      utm_medium: search.get('utm_medium'),
      utm_campaign: search.get('utm_campaign'),
      utm_content: search.get('utm_content'),
      device_type: Number.isFinite(viewportWidth) ? deviceTypeFromWidth(viewportWidth) : null,
      capture_surface: 'server',
    },
  });

  // Steps 10-11. A click is a click: it records intent, never a purchase.
  const response = NextResponse.redirect(destination.url, 307);
  response.headers.set('Cache-Control', 'no-store');

  response.cookies.set(
    COOKIE_AMAZON_CLICK,
    serializeAmazonClickValue(book.slug),
    amazonClickCookieOptions,
  );

  // Readable mirror, so client components can elevate the bonus-scene offer on
  // return without another server round trip.
  response.cookies.set(COOKIE_RETURNING_READER, '1', returningReaderCookieOptions);

  if (!request.cookies.get(COOKIE_ANON_ID)) {
    response.cookies.set(COOKIE_ANON_ID, anonymousId, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 34_560_000,
    });
  }

  return response;
}
