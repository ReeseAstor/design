/**
 * Exactly one experiment runs at launch.
 *
 * The rule the brief sets is the important part: a variant that produces more
 * Amazon clicks but lower attributable revenue loses. Nothing here changes the
 * headline, cover or trope order — only the value proposition of the CTA.
 */

export const EXPERIMENT_KEY = 'gp_hero_value_proposition';

export const EXPERIMENT_VARIANTS = ['control', 'ku_first'] as const;
export type ExperimentVariant = (typeof EXPERIMENT_VARIANTS)[number];

export const DEFAULT_VARIANT: ExperimentVariant = 'control';

export interface CtaCopy {
  /** Primary button label. */
  label: string;
  /** Supporting line rendered directly beneath the button. */
  supportingLine: string;
}

/**
 * Copy per variant. `price` and `kuEnabled` come from the resolved book format,
 * so a price change in Sanity flows through both arms without a code edit.
 */
export function ctaCopyForVariant(
  variant: ExperimentVariant,
  options: { priceUsd: number | null; kuEnabled: boolean; title: string },
): CtaCopy {
  const price =
    options.priceUsd === null ? null : `$${options.priceUsd.toFixed(2).replace(/\.00$/, '.00')}`;

  if (variant === 'ku_first' && options.kuEnabled) {
    return {
      label: 'Read with Kindle Unlimited',
      supportingLine: price
        ? `Or buy the Kindle edition for ${price}`
        : 'Or buy the Kindle edition',
    };
  }

  return {
    label: price ? `Read ${options.title} — ${price}` : `Read ${options.title}`,
    supportingLine: options.kuEnabled ? 'Also available with Kindle Unlimited' : '',
  };
}

export function isExperimentVariant(value: unknown): value is ExperimentVariant {
  return typeof value === 'string' && (EXPERIMENT_VARIANTS as readonly string[]).includes(value);
}
