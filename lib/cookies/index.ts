/**
 * First-party cookie contract.
 *
 * Only three cookies exist, none of them contains personal data, and the one
 * that records an Amazon click is HttpOnly so client code cannot read it and
 * mistake "clicked through" for "purchased".
 */

export const COOKIE_AMAZON_CLICK = 'ra_amazon_click';
export const COOKIE_ANON_ID = 'ra_aid';
export const COOKIE_RETURNING_READER = 'ra_returning';

/** 30 days, per the redirect specification. */
export const AMAZON_CLICK_MAX_AGE_SECONDS = 2_592_000;
export const ANON_ID_MAX_AGE_SECONDS = 34_560_000; // 400 days, the browser cap.

export interface AmazonClickState {
  bookSlug: string;
  clickedAt: Date;
}

export function serializeAmazonClickValue(bookSlug: string, at: Date = new Date()): string {
  return `${bookSlug}:${Math.floor(at.getTime() / 1000)}`;
}

export function parseAmazonClickValue(value: string | undefined | null): AmazonClickState | null {
  if (!value) return null;
  const separator = value.lastIndexOf(':');
  if (separator <= 0) return null;

  const bookSlug = value.slice(0, separator);
  const timestamp = Number.parseInt(value.slice(separator + 1), 10);
  if (!bookSlug || !Number.isFinite(timestamp) || timestamp <= 0) return null;

  return { bookSlug, clickedAt: new Date(timestamp * 1000) };
}

export const amazonClickCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: AMAZON_CLICK_MAX_AGE_SECONDS,
} as const;

/**
 * A readable mirror of the click cookie. The HttpOnly cookie stays the source of
 * truth for server rendering; this one only tells client components that the
 * visitor is returning, so the bonus-scene offer can be elevated without a
 * second server round-trip.
 */
export const returningReaderCookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: AMAZON_CLICK_MAX_AGE_SECONDS,
} as const;

export const anonIdCookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: ANON_ID_MAX_AGE_SECONDS,
} as const;
