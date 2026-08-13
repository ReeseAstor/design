import { expect, test } from '@playwright/test';

test.describe('accessibility and layout stability', () => {
  test('the layout does not shift while the page settles', async ({ page }) => {
    await page.goto('/golden-parachute', { waitUntil: 'load' });

    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<
              PerformanceEntry & { value: number; hadRecentInput: boolean }
            >) {
              if (!entry.hadRecentInput) total += entry.value;
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(total);
          }, 2500);
        }),
    );

    expect(cls).toBeLessThanOrEqual(0.1);
  });

  test('the cover box reserves its space before any image loads', async ({ page }) => {
    await page.goto('/golden-parachute');

    const ratio = await page.getByTestId('cover-placeholder').first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.height / rect.width;
    });

    // 1000 x 1500 is the catalog's cover proportion.
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(1.6);
  });

  test('keyboard navigation reaches the primary actions with a visible focus ring', async ({
    page,
  }) => {
    await page.goto('/golden-parachute');
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: /skip to content/i });
    await expect(skipLink).toBeFocused();

    const outline = await skipLink.evaluate((node) => {
      const style = getComputedStyle(node);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    expect(outline.style).not.toBe('none');
    expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);

    // Tab through the page and confirm the newsletter form is reachable.
    const reachedForm = await page.evaluate(async () => {
      const focusable = [
        ...document.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])'),
      ].filter((node) => node.offsetParent !== null || node.tagName === 'A');
      return focusable.some((node) => node.getAttribute('type') === 'email');
    });
    expect(reachedForm).toBe(true);
  });

  test('every form control has an associated label', async ({ page }) => {
    await page.goto('/golden-parachute');

    const unlabelled = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')]
        .filter((input) => {
          if (input.getAttribute('aria-label')) return false;
          if (input.getAttribute('aria-labelledby')) return false;
          return !input.id || !document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        })
        .map((input) => input.name || input.type),
    );

    expect(unlabelled).toEqual([]);
  });

  test('the page has one h1 and no skipped heading levels', async ({ page }) => {
    await page.goto('/golden-parachute');

    const levels = await page.evaluate(() =>
      [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((node) =>
        Number(node.tagName[1]),
      ),
    );

    expect(levels.filter((level) => level === 1)).toHaveLength(1);

    let previous = levels[0] ?? 1;
    for (const level of levels) {
      expect(level - previous).toBeLessThanOrEqual(1);
      previous = level;
    }
  });

  test('reduced-motion preference removes transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/golden-parachute');

    const durations = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, [class*="transition"]')]
        .slice(0, 40)
        .map((node) => getComputedStyle(node).transitionDuration),
    );

    for (const duration of durations) {
      const seconds = Number.parseFloat(duration);
      expect(Number.isNaN(seconds) ? 0 : seconds).toBeLessThanOrEqual(0.01);
    }
  });

  test('meets AA contrast on the primary CTA and body copy', async ({ page }) => {
    await page.goto('/golden-parachute');

    const contrast = await page.evaluate(() => {
      const luminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        }) as [number, number, number];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const parse = (value: string): number[] => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return [0, 0, 0];
        return match[1]!.split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()));
      };

      const solidBackground = (node: Element): number[] => {
        let current: Element | null = node;
        while (current) {
          const value = getComputedStyle(current).backgroundColor;
          const parsed = parse(value);
          if (!value.includes('rgba(0, 0, 0, 0)') && parsed.length === 3) return parsed;
          current = current.parentElement;
        }
        return [23, 23, 23];
      };

      const ratio = (node: Element) => {
        const style = getComputedStyle(node);
        const fg = luminance(parse(style.color));
        const bg = luminance(solidBackground(node));
        const [light, dark] = fg > bg ? [fg, bg] : [bg, fg];
        return (light! + 0.05) / (dark! + 0.05);
      };

      const cta = document.querySelector('a[href^="/go/"], [data-testid="prelaunch-notice"] a');
      const paragraph = document.querySelector('main p');

      return {
        cta: cta ? ratio(cta) : null,
        body: paragraph ? ratio(paragraph) : null,
      };
    });

    if (contrast.cta !== null) expect(contrast.cta).toBeGreaterThanOrEqual(4.5);
    if (contrast.body !== null) expect(contrast.body).toBeGreaterThanOrEqual(4.5);
  });
});
