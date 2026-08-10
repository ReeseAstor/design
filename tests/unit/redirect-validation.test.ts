import { describe, expect, it } from 'vitest';
import { buildGoHref, validateRedirectRequest } from '@/lib/validation/redirect';
import { CTA_PLACEMENTS } from '@/lib/content/types';

describe('redirect request validation', () => {
  const valid = {
    book: 'golden-parachute',
    campaignId: 'GP_META_FORCEDPROX',
    placement: 'hero',
    variant: 'control',
    format: 'ebook',
  };

  it('accepts a well-formed request', () => {
    const result = validateRedirectRequest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.campaignId).toBe('GP_META_FORCEDPROX');
  });

  it('accepts every allowed CTA placement and no others', () => {
    for (const placement of CTA_PLACEMENTS) {
      expect(validateRedirectRequest({ ...valid, placement }).ok, placement).toBe(true);
    }
    for (const placement of ['popup', 'modal', 'HERO', 'hero ', '']) {
      expect(validateRedirectRequest({ ...valid, placement }).ok, placement).toBe(false);
    }
  });

  it('rejects an unknown campaign ID', () => {
    const result = validateRedirectRequest({ ...valid, campaignId: 'GP_NOT_A_CAMPAIGN' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('campaignId');
  });

  it('rejects a missing campaign ID rather than defaulting to one', () => {
    expect(validateRedirectRequest({ ...valid, campaignId: null }).ok).toBe(false);
  });

  it('rejects book slugs that are not lowercase kebab-case', () => {
    for (const book of [
      '../../etc/passwd',
      'Golden-Parachute',
      'golden parachute',
      'golden_parachute',
      'https://evil.example',
      '',
    ]) {
      expect(validateRedirectRequest({ ...valid, book }).ok, book).toBe(false);
    }
  });

  it('rejects unknown formats and variants', () => {
    expect(validateRedirectRequest({ ...valid, format: 'hardcover' }).ok).toBe(false);
    expect(validateRedirectRequest({ ...valid, variant: 'winner' }).ok).toBe(false);
  });

  it('defaults only the unambiguous fields', () => {
    const result = validateRedirectRequest({ ...valid, format: null, variant: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.format).toBe('ebook');
      expect(result.value.variant).toBe('control');
    }
  });

  it('builds internal hrefs only', () => {
    const href = buildGoHref({
      bookSlug: 'golden-parachute',
      campaignId: 'GP_META_FORCEDPROX',
      placement: 'hero',
      variant: 'ku_first',
    });
    expect(href.startsWith('/go/golden-parachute/amazon?')).toBe(true);
    expect(href).not.toContain('amazon.com');

    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('c')).toBe('GP_META_FORCEDPROX');
    expect(params.get('variant')).toBe('ku_first');
    expect(params.get('placement')).toBe('hero');
    expect(params.get('format')).toBe('ebook');
  });
});
