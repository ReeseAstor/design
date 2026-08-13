import { describe, expect, it } from 'vitest';
import { checkAmazonDestination, isAllowedAmazonDestination } from '@/lib/amazon/allowlist';

describe('Amazon host allowlist', () => {
  it('accepts the supplied Book 0 product URL', () => {
    const result = checkAmazonDestination('https://www.amazon.com/dp/B0D82GWFD9');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hostname).toBe('www.amazon.com');
  });

  it('accepts international marketplaces and the amzn.to short domain', () => {
    for (const url of [
      'https://www.amazon.co.uk/dp/B0H1F9PV97',
      'https://www.amazon.com.au/dp/B0H53BP5S1',
      'https://amzn.to/abc123',
      'https://read.amazon.com/kp/embed',
    ]) {
      expect(isAllowedAmazonDestination(url), url).toBe(true);
    }
  });

  it('rejects every non-Amazon host', () => {
    for (const url of [
      'https://arbitrary-domain.example/',
      'https://evil.example/?next=https://www.amazon.com',
      'https://amazon.com.evil.example/dp/B0D82GWFD9',
      'https://notamazon.com/dp/B0D82GWFD9',
      'https://wwwamazon.com/dp/B0D82GWFD9',
    ]) {
      const result = checkAmazonDestination(url);
      expect(result.ok, url).toBe(false);
      if (!result.ok) expect(result.reason).toBe('host_not_allowed');
    }
  });

  it('rejects non-https schemes', () => {
    for (const url of [
      'http://www.amazon.com/dp/B0D82GWFD9',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
    ]) {
      expect(isAllowedAmazonDestination(url), url).toBe(false);
    }
  });

  it('rejects URLs carrying embedded credentials', () => {
    const result = checkAmazonDestination('https://www.amazon.com:pass@evil.example/');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['credentials_present', 'host_not_allowed']).toContain(result.reason);
  });

  it('rejects empty and unparseable input', () => {
    expect(checkAmazonDestination(null)).toEqual({ ok: false, reason: 'empty' });
    expect(checkAmazonDestination('')).toEqual({ ok: false, reason: 'empty' });
    expect(checkAmazonDestination('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(checkAmazonDestination('/dp/B0D82GWFD9')).toEqual({
      ok: false,
      reason: 'unparseable',
    });
  });
});
