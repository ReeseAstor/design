import { expect, test } from '@playwright/test';

/**
 * The organic Golden Parachute page.
 *
 * Golden Parachute is prelaunch in the seed data, so these tests assert the
 * honest degraded state: no purchase CTA, a working Book 0 offer, and no
 * fabricated cover, price link or rating anywhere on the page.
 */

test.describe('/golden-parachute', () => {
  test('is usable at 320px with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/golden-parachute');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'He built his life to control every outcome.',
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // WCAG 2.2 AA Target Size (Minimum) is 24x24 CSS px for every control...
    const undersized = await page.evaluate(() => {
      return [...document.querySelectorAll('a, button, input:not([type="hidden"])')]
        .filter((node) => {
          if (!node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
          // Screen-reader-only controls are 1px by design until focused.
          if (node.closest('.sr-only')) return false;
          // Inline links inside running text are exempt.
          if (node.closest('p, li, figcaption, label')) return false;

          const rect = node.getBoundingClientRect();
          return rect.height < 24 || rect.width < 24;
        })
        .map((node) => `${node.tagName}:${node.textContent?.trim().slice(0, 30) ?? ''}`);
    });
    expect(undersized).toEqual([]);

    // ...and the buttons that carry the funnel are comfortably past 44px.
    const primaryActions = page.locator(
      'a[href^="/go/"], [data-testid="prelaunch-notice"] a, form button[type="submit"]',
    );
    const count = await primaryActions.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await primaryActions.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test('shows the hook, title, series position and trope teaser in the first viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/golden-parachute');

    for (const text of [
      'She refuses to become another thing he can buy.',
      'Golden Parachute',
      'Hudson Dynasty · Book 3',
      'Billionaire',
      'Forced Proximity',
      'High Heat',
    ]) {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  });

  test('is indexable and canonical to itself', async ({ page }) => {
    const response = await page.goto('/golden-parachute');
    expect(response?.status()).toBe(200);

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots ?? 'index').not.toContain('noindex');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/golden-parachute');
  });

  test('emits Book and BreadcrumbList structured data with no invented rating', async ({ page }) => {
    await page.goto('/golden-parachute');

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((block) => JSON.parse(block));

    const book = parsed.find((entry) => entry['@type'] === 'Book');
    const breadcrumb = parsed.find((entry) => entry['@type'] === 'BreadcrumbList');

    expect(book?.name).toBe('Golden Parachute');
    expect(book?.author?.name).toBe('Reese Astor');
    expect(book?.aggregateRating).toBeUndefined();
    expect(book?.review).toBeUndefined();
    expect(breadcrumb?.itemListElement).toHaveLength(3);
  });

  test('renders the placeholder cover, never another title’s art', async ({ page }) => {
    await page.goto('/golden-parachute');

    const placeholder = page.getByTestId('cover-placeholder').first();
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText('Golden Parachute');
    await expect(placeholder).toContainText('Reese Astor');

    // No hero image is loaded for a title with no approved cover.
    const heroImages = await page.locator('main img').count();
    expect(heroImages).toBeLessThanOrEqual(1); // only Book 0's cover in the entry offer
  });

  test('shows no purchase CTA while the title is prelaunch', async ({ page }) => {
    await page.goto('/golden-parachute');

    await expect(page.getByTestId('prelaunch-notice').first()).toBeVisible();

    const goldenParachuteBuyLinks = await page
      .locator('a[href*="/go/golden-parachute/amazon"]')
      .count();
    expect(goldenParachuteBuyLinks).toBe(0);

    await expect(page.getByTestId('sticky-buy-bar')).toHaveCount(0);
  });

  test('displays no stars, review counts or testimonials', async ({ page }) => {
    await page.goto('/golden-parachute');

    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).not.toContain('★');
    expect(body).not.toMatch(/\b\d[\d,]*\s+(reviews|ratings)\b/);
    expect(await page.getByRole('heading', { name: /verified reader response/i }).count()).toBe(0);
  });

  test('shows the content notes plainly', async ({ page }) => {
    await page.goto('/golden-parachute');

    await expect(page.getByRole('heading', { name: 'Content notes' })).toBeVisible();

    for (const note of [
      'Adult and explicit consensual intimacy',
      'Serious medical crisis',
      'Pneumonia and sepsis themes',
      'Compulsive sexual behavior and recovery',
      'Caregiving stress',
      'Family and financial pressure',
    ]) {
      await expect(page.getByText(note, { exact: true })).toBeVisible();
    }
  });

  test('keeps the section order fixed', async ({ page }) => {
    await page.goto('/golden-parachute');

    const order = await page.evaluate(() =>
      [...document.querySelectorAll('main h1, main h2')].map(
        (heading) => heading.textContent?.trim() ?? '',
      ),
    );

    const indexOf = (needle: string) => order.findIndex((text) => text.includes(needle));

    // Hero first, then tropes, synopsis, Book 0, newsletter, content notes.
    expect(indexOf('He built his life')).toBe(0);
    expect(indexOf('A love story about wanting more')).toBeGreaterThan(0);
    expect(indexOf('A love story about wanting more')).toBeLessThan(indexOf('synopsis'));
    expect(indexOf('synopsis')).toBeLessThan(indexOf('Start with Book 0'));
    expect(indexOf('Start with Book 0')).toBeLessThan(indexOf('The Morning After the Parachute'));
    expect(indexOf('The Morning After the Parachute')).toBeLessThan(indexOf('Content notes'));
  });
});
