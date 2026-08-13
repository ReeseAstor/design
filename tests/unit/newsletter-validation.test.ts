import { describe, expect, it } from 'vitest';
import {
  HONEYPOT_FIELD,
  normaliseSourceUrl,
  validateNewsletterPayload,
} from '@/lib/validation/newsletter';

const base = {
  email: 'reader@example.com',
  first_name: 'Optional',
  consent: true,
  campaign_id: 'GP_META_FORCEDPROX',
  book_interest: 'golden_parachute',
  offer_id: 'morning_after',
  source_url: '/gp/meta-forced-proximity',
};

describe('newsletter payload validation', () => {
  it('accepts the documented payload', () => {
    const result = validateNewsletterPayload(base);
    expect(result.ok).toBe(true);
  });

  it('rejects a submission without consent', () => {
    for (const consent of [false, 'true', 1, null, undefined]) {
      const result = validateNewsletterPayload({ ...base, consent });
      expect(result.ok, String(consent)).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(422);
        expect(result.fieldErrors.consent).toBeDefined();
      }
    }
  });

  it('rejects a filled honeypot without revealing why', () => {
    const result = validateNewsletterPayload({ ...base, [HONEYPOT_FIELD]: 'http://spam.example' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.fieldErrors).toEqual({});
    }
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['', 'reader', 'reader@', '@example.com', 'a@b']) {
      expect(validateNewsletterPayload({ ...base, email }).ok, email).toBe(false);
    }
  });

  it('rejects an unknown campaign ID', () => {
    expect(validateNewsletterPayload({ ...base, campaign_id: 'GP_MADE_UP' }).ok).toBe(false);
  });

  it('accepts an omitted campaign ID', () => {
    expect(validateNewsletterPayload({ ...base, campaign_id: '' }).ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    for (const body of [null, 'string', 42, undefined]) {
      expect(validateNewsletterPayload(body).ok).toBe(false);
    }
  });
});

describe('source URL normalisation', () => {
  it('keeps same-site paths', () => {
    expect(normaliseSourceUrl('/gp/tiktok-kai')).toBe('/gp/tiktok-kai');
  });

  it('discards absolute and protocol-relative URLs', () => {
    expect(normaliseSourceUrl('https://evil.example/steal')).toBe('');
    expect(normaliseSourceUrl('//evil.example/steal')).toBe('');
    expect(normaliseSourceUrl(undefined)).toBe('');
  });
});
