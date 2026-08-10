/**
 * Variant assignment.
 *
 * Assignment happens on the server from a first-party anonymous ID so that the
 * CTA is correct in the first server-rendered byte. A client-side flag lookup
 * would either delay the Buy button or swap its label after paint, and the
 * primary CTA has to be usable immediately.
 *
 * The same anonymous ID is sent to PostHog as the distinct ID, so the
 * `experiment_exposure` event PostHog records lines up with what was rendered.
 */

import {
  DEFAULT_VARIANT,
  EXPERIMENT_VARIANTS,
  type ExperimentVariant,
} from './definitions';

/** FNV-1a, 32-bit. Small, stable across runtimes, and adequate for bucketing. */
export function hashToUnitInterval(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 0x100000000;
}

export function assignVariant(
  experimentKey: string,
  anonymousId: string | null | undefined,
): ExperimentVariant {
  if (!anonymousId) return DEFAULT_VARIANT;

  const bucket = hashToUnitInterval(`${experimentKey}:${anonymousId}`);
  const index = Math.min(
    EXPERIMENT_VARIANTS.length - 1,
    Math.floor(bucket * EXPERIMENT_VARIANTS.length),
  );
  return EXPERIMENT_VARIANTS[index] ?? DEFAULT_VARIANT;
}

/**
 * Generates the anonymous ID stored in the `ra_aid` cookie. It identifies a
 * browser for bucketing and nothing else — it is never linked to an email
 * address, and it is not sent to Kit.
 */
export function createAnonymousId(): string {
  return globalThis.crypto.randomUUID();
}

export function isValidAnonymousId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
