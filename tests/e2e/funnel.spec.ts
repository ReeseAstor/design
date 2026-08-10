import { expect, test, type Page } from '@playwright/test';

/**
 * Funnel state, analytics contract and the newsletter path.
 *
 * The analytics assertions read `window.__raAnalytics`, which the capture helper
 * populates in every mode — so the event contract is verified without a PostHog
 * project, exactly as a fresh clone runs.
 */

type CapturedEvent = { event: string; properties: Record<string, unknown> };

async function capturedEvents(page: Page): Promise<CapturedEvent[]> {
  return page.evaluate(() => window.__raAnalytics ?? []);
}

test.describe('analytics contract', () => {
  test('landing_view carries campaign, variant and no email', async ({ page }) => {
    await page.goto('/gp/tiktok-kai');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expect
      .poll(async () => (await capturedEvents(page)).map((entry) => entry.event))
      .toContain('landing_view');

    const events = await capturedEvents(page);
    const landingView = events.find((entry) => entry.event === 'landing_view');

    expect(landingView?.properties.campaign_id).toBe('GP_TIKTOK_KAI');
    expect(landingView?.properties.book_id).toBe('golden-parachute');
    expect(landingView?.properties.traffic_source).toBe('tiktok');
    expect(landingView?.properties.experiment_key).toBe('gp_hero_value_proposition');
    expect(['control', 'ku_first']).toContain(landingView?.properties.experiment_variant);
    expect(landingView?.properties.device_type).toBeTruthy();
  });

  test('experiment_exposure is emitted with the rendered variant', async ({ page }) => {
    await page.goto('/gp/meta-forced-proximity');

    await expect
      .poll(async () => (await capturedEvents(page)).map((entry) => entry.event))
      .toContain('experiment_exposure');

    const exposure = (await capturedEvents(page)).find(
      (entry) => entry.event === 'experiment_exposure',
    );

    expect(exposure?.properties.$feature_flag).toBe('gp_hero_value_proposition');
    expect(['control', 'ku_first']).toContain(exposure?.properties.$feature_flag_response);
  });

  test('a Book 0 click carries the placement and no personal data', async ({ page, context }) => {
    await page.goto('/golden-parachute');

    const bookZeroCta = page.locator('a[href*="/go/the-first-acquisition/amazon"]').first();
    await bookZeroCta.scrollIntoViewIfNeeded();

    const href = await bookZeroCta.getAttribute('href');
    expect(href).toContain('placement=series_entry');
    expect(href).toContain('c=GP_ORGANIC');
    expect(href).toMatch(/variant=(control|ku_first)/);

    // Fire the handler without leaving the page for amazon.com.
    await page.route('**/go/**', (route) => route.fulfill({ status: 204, body: '' }));
    await bookZeroCta.click();

    await expect
      .poll(async () => (await capturedEvents(page)).map((entry) => entry.event))
      .toContain('book0_click');

    const click = (await capturedEvents(page)).find((entry) => entry.event === 'book0_click');
    expect(click?.properties.cta_location).toBe('series_entry');
    expect(click?.properties.book_id).toBe('the-first-acquisition');
  });

  test('no captured event ever contains an email address', async ({ page }) => {
    await page.goto('/golden-parachute');
    await page.getByLabel('Email address').first().fill('reader@example.com');
    await page.getByRole('checkbox').first().check();

    await page.route('**/api/newsletter', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'You’re on the list.' }),
      }),
    );

    await page.getByRole('button', { name: /bonus scene/i }).first().click();

    await expect
      .poll(async () => (await capturedEvents(page)).map((entry) => entry.event))
      .toContain('newsletter_subscribed');

    const serialised = JSON.stringify(await capturedEvents(page));
    expect(serialised).not.toContain('reader@example.com');
    expect(serialised).not.toContain('@example.com');
    expect(serialised.toLowerCase()).not.toContain('"email"');
    expect(serialised.toLowerCase()).not.toContain('first_name');
  });
});

test.describe('newsletter', () => {
  test('requires consent before anything is submitted', async ({ page }) => {
    let submissions = 0;
    await page.route('**/api/newsletter', (route) => {
      submissions += 1;
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/golden-parachute');
    await page.getByLabel('Email address').first().fill('reader@example.com');
    await page.getByRole('button', { name: /bonus scene/i }).first().click();

    await expect(page.getByRole('alert').first()).toContainText(/consent|confirm/i);
    expect(submissions).toBe(0);
  });

  test('the API rejects a payload without consent', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'reader@example.com',
        consent: false,
        campaign_id: 'GP_ORGANIC',
        book_interest: 'golden_parachute',
        offer_id: 'morning_after',
        source_url: '/golden-parachute',
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.fieldErrors.consent).toBeTruthy();
  });

  test('the API rejects a filled honeypot', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'bot@example.com',
        consent: true,
        website: 'http://spam.example',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('a consented submission succeeds in mock mode and announces itself', async ({ page }) => {
    await page.goto('/golden-parachute');

    await page.getByLabel('Email address').first().fill('reader@example.com');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /bonus scene/i }).first().click();

    await expect(page.getByRole('status').first()).toBeVisible();
    await expect(page.getByRole('status').first()).toContainText(/list|inbox/i);
  });
});

test.describe('funnel state', () => {
  test('a returning Amazon-click visitor sees the bonus offer elevated', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'ra_returning',
        value: '1',
        url: page.url().startsWith('http') ? page.url() : 'http://localhost:3100',
      },
    ]);

    await page.goto('/golden-parachute');
    await expect(page.getByTestId('returning-reader-offer')).toBeVisible();
    await expect(page.getByTestId('returning-reader-offer')).toContainText(
      'Welcome back to the Hudsons.',
    );
  });

  test('never claims the visitor bought the book', async ({ page, context }) => {
    await context.addCookies([
      { name: 'ra_returning', value: '1', url: 'http://localhost:3100' },
    ]);

    await page.goto('/golden-parachute');
    const body = (await page.locator('body').innerText()).toLowerCase();

    expect(body).not.toContain('thanks for buying');
    expect(body).not.toContain('thank you for your purchase');
    expect(body).not.toContain('enjoy your copy');
  });

  test('a high-engagement non-clicker sees the inline recovery offer', async ({ page }) => {
    await page.goto('/golden-parachute');

    // Scroll past the 60% depth threshold.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const recovery = page.getByTestId('recovery-offer');
    await expect(recovery).toBeVisible({ timeout: 15_000 });
    await expect(recovery).toContainText('Not ready to start Kai and Miri yet?');

    // It is inline, not a modal, and it does not sit over anything.
    const position = await recovery.evaluate((node) => getComputedStyle(node).position);
    expect(['static', 'relative']).toContain(position);
    expect(await page.locator('dialog[open], [role="dialog"]').count()).toBe(0);
  });

  test('the recovery offer appears at most once per session', async ({ page }) => {
    await page.goto('/golden-parachute');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByTestId('recovery-offer')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    expect(await page.getByTestId('recovery-offer').count()).toBe(1);
  });
});
