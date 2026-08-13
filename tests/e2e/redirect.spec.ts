import { expect, test } from '@playwright/test';

/**
 * The tracked Amazon redirect: the one path from this site to a retailer, and
 * therefore the one place an open redirect could ever appear.
 */

const BOOK_ZERO = 'https://www.amazon.com/dp/B0D82GWFD9';

test.describe('/go/[book]/amazon', () => {
  test('resolves the Book 0 destination exactly as supplied', async ({ request }) => {
    const response = await request.get(
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=series_entry&variant=control&format=ebook',
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe(BOOK_ZERO);
    expect(response.headers()['cache-control']).toContain('no-store');
  });

  test('sets the returning-reader state on the redirect', async ({ request }) => {
    const response = await request.get(
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=hero&variant=control&format=ebook',
      { maxRedirects: 0 },
    );

    const setCookie = response.headersArray().filter((header) => header.name.toLowerCase() === 'set-cookie');
    const joined = setCookie.map((header) => header.value).join('\n');

    expect(joined).toContain('ra_amazon_click=the-first-acquisition%3A');
    expect(joined).toMatch(/ra_amazon_click=[^;]+;[^\n]*HttpOnly/i);
    expect(joined).toMatch(/ra_amazon_click=[^;]+;[^\n]*Secure/i);
    expect(joined).toMatch(/ra_amazon_click=[^;]+;[^\n]*SameSite=Lax/i);
    expect(joined).toMatch(/ra_amazon_click=[^;]+;[^\n]*Max-Age=2592000/i);
    expect(joined).toContain('ra_returning=1');
  });

  test('an invalid campaign cannot produce an external redirect', async ({ request }) => {
    const response = await request.get(
      '/go/the-first-acquisition/amazon?c=GP_NOT_A_CAMPAIGN&placement=hero&variant=control',
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(400);
    expect(response.headers()['location']).toBeUndefined();
  });

  test('rejects an absent campaign rather than defaulting to one', async ({ request }) => {
    const response = await request.get('/go/the-first-acquisition/amazon?placement=hero', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(400);
    expect(response.headers()['location']).toBeUndefined();
  });

  test('rejects an invalid CTA placement', async ({ request }) => {
    const response = await request.get(
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=popup&variant=control',
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(400);
  });

  test('there is no url parameter to abuse', async ({ request }) => {
    for (const attempt of [
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=hero&url=https://arbitrary-domain.example',
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=hero&destination=https://arbitrary-domain.example',
      '/go/the-first-acquisition/amazon?c=GP_ORGANIC&placement=hero&redirect=//arbitrary-domain.example',
    ]) {
      const response = await request.get(attempt, { maxRedirects: 0 });
      // The extra parameter is ignored entirely: the destination still comes
      // from content, never from the query string.
      expect(response.status(), attempt).toBe(307);
      expect(response.headers()['location'], attempt).toBe(BOOK_ZERO);
    }
  });

  test('rejects a traversal or absolute-URL book slug', async ({ request }) => {
    for (const slug of ['..%2F..%2Fetc%2Fpasswd', 'Golden-Parachute', 'golden_parachute']) {
      const response = await request.get(
        `/go/${slug}/amazon?c=GP_ORGANIC&placement=hero&variant=control`,
        { maxRedirects: 0 },
      );
      expect([400, 404], slug).toContain(response.status());
      expect(response.headers()['location'], slug).toBeUndefined();
    }
  });

  test('Golden Parachute has no destination and does not redirect', async ({ request }) => {
    const response = await request.get(
      '/go/golden-parachute/amazon?c=GP_ORGANIC&placement=hero&variant=control&format=ebook',
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['location']).toBeUndefined();
  });

  test('a paid campaign will not fall back to an unattributed product URL', async ({ request }) => {
    const response = await request.get(
      '/go/the-first-acquisition/amazon?c=GP_META_FORCEDPROX&placement=hero&variant=control&format=ebook',
      { maxRedirects: 0 },
    );

    // No Amazon Attribution URL is configured for the paid campaigns, so the
    // route refuses rather than sending untracked paid traffic to Amazon.
    expect(response.status()).toBe(404);
    expect(response.headers()['location']).toBeUndefined();
  });
});
