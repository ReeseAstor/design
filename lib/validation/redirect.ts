/**
 * Request validation for GET /go/[book]/amazon.
 *
 * Everything the reader's browser supplies is treated as untrusted and matched
 * against a closed set. Nothing in this module can produce a URL.
 */

import { z } from 'zod';
import { BOOK_FORMATS, CTA_PLACEMENTS } from '@/lib/content/types';
import { EXPERIMENT_VARIANTS } from '@/lib/experiments/definitions';
import { CAMPAIGN_IDS } from '@/lib/campaigns/registry';

const BOOK_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const bookSlugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(BOOK_SLUG_PATTERN, 'Book slug must be lowercase kebab-case.');

export const campaignIdSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => CAMPAIGN_IDS.includes(value), {
    message: 'Unknown campaign ID.',
  });

export const ctaPlacementSchema = z.enum(CTA_PLACEMENTS);
export const bookFormatSchema = z.enum(BOOK_FORMATS);
export const experimentVariantSchema = z.enum(EXPERIMENT_VARIANTS);

export const redirectRequestSchema = z.object({
  book: bookSlugSchema,
  campaignId: campaignIdSchema,
  placement: ctaPlacementSchema,
  variant: experimentVariantSchema,
  format: bookFormatSchema,
});

export type RedirectRequest = z.infer<typeof redirectRequestSchema>;

export interface RawRedirectRequest {
  book: string;
  campaignId: string | null;
  placement: string | null;
  variant: string | null;
  format: string | null;
}

export type RedirectValidation =
  | { ok: true; value: RedirectRequest }
  | { ok: false; errors: string[] };

/**
 * Defaults are applied only where omission is unambiguous: the ebook format and
 * the control variant. The campaign and the placement must be stated, because
 * an unattributed click is a measurement hole.
 */
export function validateRedirectRequest(raw: RawRedirectRequest): RedirectValidation {
  const parsed = redirectRequestSchema.safeParse({
    book: raw.book,
    campaignId: raw.campaignId ?? '',
    placement: raw.placement ?? '',
    variant: raw.variant ?? 'control',
    format: raw.format ?? 'ebook',
  });

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`),
    };
  }

  return { ok: true, value: parsed.data };
}

/** Builds the internal href every purchase CTA points at. */
export function buildGoHref(params: {
  bookSlug: string;
  campaignId: string;
  placement: string;
  variant: string;
  format?: string;
}): string {
  const search = new URLSearchParams({
    c: params.campaignId,
    placement: params.placement,
    variant: params.variant,
    format: params.format ?? 'ebook',
  });
  return `/go/${params.bookSlug}/amazon?${search.toString()}`;
}
