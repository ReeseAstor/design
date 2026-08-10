import { expect, test } from '@playwright/test';

const CAMPAIGNS = [
  { path: '/gp/meta-forced-proximity', campaignId: 'GP_META_FORCEDPROX' },
  { path: '/gp/tiktok-kai', campaignId: 'GP_TIKTOK_KAI' },
  { path: '/gp/bookbub-billionaire', campaignId: 'GP_BOOKBUB_BILLIONAIRE' },
  { path: '/gp/newsletter', campaignId: 'GP_NEWSLETTER_EXISTING' },
];

test.describe('paid campaign landing pages', () => {
  for (const campaign of CAMPAIGNS) {
    test(`${campaign.path} is noindex, follow and canonical to the organic page`, async ({
      page,
    }) => {
      const response = await page.goto(campaign.path);
      expect(response?.status()).toBe(200);

      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).toContain('noindex');
      expect(robots).toContain('follow');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain('/golden-parachute');
      expect(canonical).not.toContain('/gp/');
    });

    test(`${campaign.path} still provides Open Graph metadata for sharing`, async ({ page }) => {
      await page.goto(campaign.path);

      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        /Golden Parachute/,
      );
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        /.{40,}/,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
    });

    test(`${campaign.path} shows no competing navigation above the first CTA`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(campaign.path);

      // The header is a wordmark, not a nav.
      await expect(page.getByTestId('minimal-header')).toBeVisible();
      expect(await page.locator('header nav').count()).toBe(0);
      expect(await page.locator('header a').count()).toBe(0);

      // Nothing above the first call to action leads out of the funnel. In-page
      // anchors are part of the offer; a link to another route is an exit.
      const firstCtaTop = await page.evaluate(() => {
        const cta =
          document.querySelector('a[href^="/go/"]') ??
          document.querySelector('[data-testid="prelaunch-notice"] a');
        return cta ? cta.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY;
      });
      expect(firstCtaTop).toBeLessThan(Number.POSITIVE_INFINITY);

      const exitsAbove = await page.evaluate((ctaTop: number) => {
        return [...document.querySelectorAll('a[href]')]
          .filter((anchor) => {
            const rect = anchor.getBoundingClientRect();
            if (rect.height === 0) return false;
            return rect.top + window.scrollY < ctaTop;
          })
          .map((anchor) => anchor.getAttribute('href') ?? '')
          .filter((href) => !href.startsWith('#') && !href.startsWith('/go/'));
      }, firstCtaTop);

      expect(exitsAbove).toEqual([]);
    });
  }

  test('an unknown campaign slug 404s rather than rendering an offer', async ({ page }) => {
    const response = await page.goto('/gp/not-a-real-campaign');
    expect(response?.status()).toBe(404);
  });

  test('/gp/golden-parachute is not a route — the organic page owns that URL', async ({ page }) => {
    const response = await page.goto('/gp/golden-parachute');
    expect(response?.status()).toBe(404);
  });

  test('the sitemap excludes campaign, redirect, api and studio paths', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain('/golden-parachute');
    expect(xml).toContain('/hudson-dynasty');
    expect(xml).not.toContain('/gp/');
    expect(xml).not.toContain('/go/');
    expect(xml).not.toContain('/api/');
    expect(xml).not.toContain('/studio');
  });

  test('robots.txt disallows the campaign and redirect paths', async ({ request }) => {
    const response = await request.get('/robots.txt');
    const text = await response.text();

    expect(text).toContain('Disallow: /gp/');
    expect(text).toContain('Disallow: /go/');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain('Disallow: /studio/');
    expect(text).toContain('Sitemap:');
  });
});
