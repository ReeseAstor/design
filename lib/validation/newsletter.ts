/**
 * Newsletter payload validation.
 *
 * Consent is not a checkbox we can infer. If `consent` is not literally `true`
 * the request is rejected before Kit is contacted.
 */

import { z } from 'zod';
import { CAMPAIGN_IDS } from '@/lib/campaigns/registry';

/** Bots fill every field they can see; humans never see this one. */
export const HONEYPOT_FIELD = 'website';

export const newsletterPayloadSchema = z.object({
  email: z.string().trim().min(5).max(254).email('Enter an email address we can reach you at.'),
  first_name: z.string().trim().max(80).optional().or(z.literal('')),
  consent: z.literal(true, {
    message: 'Consent is required before we can add you to the reader list.',
  }),
  campaign_id: z
    .string()
    .max(64)
    .refine((value) => value === '' || CAMPAIGN_IDS.includes(value), 'Unknown campaign ID.')
    .optional()
    .or(z.literal('')),
  book_interest: z.string().trim().max(64).optional().or(z.literal('')),
  offer_id: z.string().trim().max(64).optional().or(z.literal('')),
  source_url: z.string().trim().max(512).optional().or(z.literal('')),
  [HONEYPOT_FIELD]: z.string().max(0, 'Rejected.').optional().or(z.literal('')),
});

export type NewsletterPayload = z.infer<typeof newsletterPayloadSchema>;

export type NewsletterValidation =
  | { ok: true; value: NewsletterPayload }
  | { ok: false; status: number; message: string; fieldErrors: Record<string, string> };

export function validateNewsletterPayload(input: unknown): NewsletterValidation {
  if (typeof input !== 'object' || input === null) {
    return {
      ok: false,
      status: 400,
      message: 'We could not read that submission.',
      fieldErrors: {},
    };
  }

  const record = input as Record<string, unknown>;

  // The honeypot is answered before anything else so a bot never learns which
  // other fields were wrong.
  const honeypot = record[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return {
      ok: false,
      status: 400,
      message: 'We could not process that submission.',
      fieldErrors: {},
    };
  }

  const parsed = newsletterPayloadSchema.safeParse(record);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    const consentRejected = 'consent' in fieldErrors;
    return {
      ok: false,
      status: consentRejected ? 422 : 400,
      message: consentRejected
        ? 'Please confirm you want Reese’s reader emails.'
        : 'Please check the details below.',
      fieldErrors,
    };
  }

  return { ok: true, value: parsed.data };
}

/** Source URLs are stored for attribution, so only same-site paths are kept. */
export function normaliseSourceUrl(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '';
  return trimmed.slice(0, 512);
}
