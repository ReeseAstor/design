import {
  GP_PRELAUNCH_BODY,
  GP_PRELAUNCH_EYEBROW,
  GP_PRELAUNCH_HEADLINE,
} from '@/lib/content/golden-parachute';
import { formatPrice, type ConversionViewModel } from '@/lib/conversion/view-model';

/**
 * Shown in place of the purchase CTA when the publication guard blocks it.
 *
 * There is no button here that pretends to sell the book. Golden Parachute has
 * no ASIN, no product URL and no approved cover yet, so the honest offer is the
 * series entry and the bonus scene — both of which are real.
 */
export function PrelaunchNotice({ model }: { model: ConversionViewModel }) {
  const price = formatPrice(model.priceUsd);

  return (
    <div
      data-testid="prelaunch-notice"
      className="rounded-sm border border-gold/40 bg-graphite/60 p-5 sm:p-6"
    >
      <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold">{GP_PRELAUNCH_EYEBROW}</p>
      <h2 className="mt-3 font-display text-[1.45rem] leading-tight text-ivory">
        {GP_PRELAUNCH_HEADLINE}
      </h2>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ivory/85">{GP_PRELAUNCH_BODY}</p>

      {price ? (
        <p className="mt-4 text-sm text-ink-muted">
          Planned release price {price}
          {model.kuEnabled ? ', and it will be in Kindle Unlimited' : ''}.
        </p>
      ) : null}

      <a
        href="#newsletter-heading-standalone"
        className="tap-target mt-5 inline-flex w-full items-center justify-center rounded-sm bg-gold px-6 py-4 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright motion-reduce:transition-none"
      >
        Tell me when it’s live
      </a>
    </div>
  );
}
