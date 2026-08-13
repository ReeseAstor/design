import { expect, test } from '@playwright/test';

test.describe('site routes and migration', () => {
  const ROUTES = [
    '/',
    '/books',
    '/hudson-dynasty',
    '/about',
    '/contact',
    '/privacy',
    '/cookies',
    '/golden-parachute',
    '/gp/meta-forced-proximity',
    '/gp/tiktok-kai',
    '/gp/bookbub-billionaire',
    '/gp/newsletter',
  ];

  for (const route of ROUTES) {
    test(`${route} responds 200`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(200);
    });
  }

  const LEGACY = [
    ['/index.html', '/'],
    ['/books.html', '/books'],
    ['/about.html', '/about'],
    ['/contact.html', '/contact'],
  ] as const;

  for (const [from, to] of LEGACY) {
    test(`${from} permanently redirects to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers()['location']).toContain(to);
    });
  }

  test('every purchase button on the site routes through /go/', async ({ page }) => {
    for (const route of ['/golden-parachute', '/hudson-dynasty', '/books/hostile-tender', '/']) {
      await page.goto(route);

      const amazonLinks = await page.evaluate(() =>
        [...document.querySelectorAll('a[href]')]
          .map((anchor) => anchor.getAttribute('href') ?? '')
          .filter((href) => href.includes('amazon.') || href.includes('amzn.')),
      );

      expect(amazonLinks, `${route} must not link to Amazon directly`).toEqual([]);
    }
  });

  test('a live book page offers each format through the tracked route', async ({ page }) => {
    await page.goto('/books/hostile-tender');

    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/go/"]')].map((anchor) => anchor.getAttribute('href')),
    );

    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) {
      expect(href).toContain('/go/hostile-tender/amazon');
      expect(href).toContain('c=GP_ORGANIC');
      expect(href).toMatch(/placement=(hero|series_entry|mid_blurb|sticky_mobile|footer)/);
    }
  });

  test('/books/golden-parachute redirects to the conversion page', async ({ page }) => {
    await page.goto('/books/golden-parachute');
    expect(new URL(page.url()).pathname).toBe('/golden-parachute');
  });

  test('the legal pages disclose adult content, medical themes and consent', async ({ page }) => {
    await page.goto('/privacy');
    const privacy = (await page.locator('main').innerText()).toLowerCase();

    expect(privacy).toContain('explicit consensual intimacy');
    expect(privacy).toContain('18 and older');
    expect(privacy).toContain('recovery');
    expect(privacy).toContain('consent');
    expect(privacy).toContain('unsubscribe');
    expect(privacy).toContain('trademark');

    await page.goto('/cookies');
    const cookies = (await page.locator('main').innerText()).toLowerCase();
    expect(cookies).toContain('ra_amazon_click');
    expect(cookies).toContain('ra_aid');
    expect(cookies).toContain('analytics');
  });

  test('the studio route is not indexed', async ({ page }) => {
    await page.goto('/studio');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('the sticky mobile bar never covers the last section', async ({ page }) => {
    // A short viewport guarantees the page scrolls past the hero CTA, which is
    // the condition that brings the bar out.
    await page.setViewportSize({ width: 390, height: 420 });
    await page.goto('/books/hostile-tender');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const bar = page.getByTestId('sticky-buy-bar');
    await expect(bar).toHaveAttribute('data-visible', 'true');

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="sticky-buy-bar"]');
      if (!bar || bar.getAttribute('data-visible') !== 'true') return 0;

      const barRect = bar.getBoundingClientRect();
      const contentNodes = [...document.querySelectorAll('main a, main button, main p')];

      let worst = 0;
      for (const node of contentNodes) {
        const rect = node.getBoundingClientRect();
        if (rect.height === 0) continue;
        const covered = Math.min(rect.bottom, barRect.bottom) - Math.max(rect.top, barRect.top);
        if (covered > 0) worst = Math.max(worst, covered);
      }
      return worst;
    });

    expect(overlap).toBe(0);
  });
});

test.describe('sticky mobile purchase bar', () => {
  test.use({ viewport: { width: 390, height: 420 } });

  test('stays hidden while the hero CTA is on screen', async ({ page }) => {
    await page.goto('/books/hostile-tender');
    await expect(page.getByTestId('sticky-buy-bar')).toHaveAttribute('data-visible', 'false');
  });

  test('appears once the hero CTA scrolls away, and sells through /go/', async ({ page }) => {
    await page.goto('/books/hostile-tender');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const bar = page.getByTestId('sticky-buy-bar');
    await expect(bar).toHaveAttribute('data-visible', 'true');

    const href = await bar.locator('a[href]').first().getAttribute('href');
    expect(href).toContain('/go/hostile-tender/amazon');
    expect(href).toContain('placement=sticky_mobile');
  });

  test('clears the safe-area inset at the bottom of the viewport', async ({ page }) => {
    await page.goto('/books/hostile-tender');

    const padding = await page
      .getByTestId('sticky-buy-bar')
      .evaluate((node) => getComputedStyle(node).paddingBottom);

    // max(0.75rem, env(...)) resolves to at least 12px on a device with no inset.
    expect(Number.parseFloat(padding)).toBeGreaterThanOrEqual(12);
  });
});
