'use client';

/**
 * The reader-list offer.
 *
 * Three surfaces, one component:
 *   - `standalone`  the fixed section in the page order
 *   - `recovery`    the inline module revealed on high engagement
 *   - `returning`   elevated for a reader who already clicked through to Amazon
 *
 * It is never a modal and never covers the Buy button. The newsletter is a
 * recovery path for readers who are not buying today, not a toll gate in front
 * of the ones who are.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { captureEvent } from '@/components/analytics/PostHogProvider';
import { HONEYPOT_FIELD } from '@/lib/validation/newsletter';
import type { NewsletterOffer as NewsletterOfferContent, TrafficSource } from '@/lib/content/types';

type Surface = 'standalone' | 'recovery' | 'returning';
type Status = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterOfferProps {
  offer: NewsletterOfferContent;
  campaignId: string;
  bookSlug: string;
  trafficSource: TrafficSource | null;
  sourceUrl: string;
  surface?: Surface;
  variant?: string;
  experimentKey?: string | null;
}

export function NewsletterOffer({
  offer,
  campaignId,
  bookSlug,
  trafficSource,
  sourceUrl,
  surface = 'standalone',
  variant = 'control',
  experimentKey = null,
}: NewsletterOfferProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const emailId = useId();
  const consentId = useId();
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewed = useRef(false);

  // `newsletter_view` fires when the module is actually on screen, so the
  // recovery module is not credited with a view it never got.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewed.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewed.current) {
            viewed.current = true;
            captureEvent('newsletter_view', {
              campaign_id: campaignId,
              book_id: bookSlug,
              traffic_source: trafficSource,
              offer_id: offer.offerId,
              surface,
              experiment_key: experimentKey,
              experiment_variant: variant,
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [campaignId, bookSlug, trafficSource, offer.offerId, surface, experimentKey, variant]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!consent) {
      setConsentError(true);
      setStatus('error');
      setMessage('Please confirm you want Reese’s reader emails.');
      return;
    }

    setConsentError(false);
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          first_name: String(data.get('first_name') ?? ''),
          consent: true,
          campaign_id: campaignId,
          book_interest: bookSlug.replaceAll('-', '_'),
          offer_id: offer.offerId,
          source_url: sourceUrl,
          [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ''),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setStatus('error');
        setMessage(payload?.message ?? 'That did not go through. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(payload?.message ?? 'Check your inbox — the bonus scene is on its way.');
      form.reset();
      setConsent(false);

      // No email address, no name, no form payload. Only the shape of the event.
      captureEvent('newsletter_subscribed', {
        campaign_id: campaignId,
        book_id: bookSlug,
        traffic_source: trafficSource,
        offer_id: offer.offerId,
        surface,
        experiment_key: experimentKey,
        experiment_variant: variant,
      });
    } catch {
      setStatus('error');
      setMessage('We could not reach the reader list. Please try again in a moment.');
    }
  }

  const headline =
    surface === 'recovery'
      ? offer.recoveryHeadline
      : surface === 'returning'
        ? offer.returningHeadline
        : offer.title;

  const body =
    surface === 'recovery'
      ? offer.recoveryBody
      : surface === 'returning'
        ? offer.returningBody
        : offer.promise;

  const ctaLabel = surface === 'recovery' ? offer.recoveryCtaLabel : offer.ctaLabel;

  const containerTone =
    surface === 'standalone'
      ? 'border-line bg-graphite/50'
      : 'border-gold/40 bg-graphite/70';

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`newsletter-heading-${surface}`}
      data-newsletter-surface={surface}
      className={`px-5 py-12 sm:px-8 ${surface === 'recovery' ? 'reveal' : ''}`}
    >
      <div className={`mx-auto max-w-2xl rounded-sm border p-6 sm:p-8 ${containerTone}`}>
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold">
          {surface === 'standalone' ? 'Exclusive bonus scene' : 'Hudson Dynasty bonus scene'}
        </p>
        <h2
          id={`newsletter-heading-${surface}`}
          className="mt-3 text-balance font-display text-[1.65rem] leading-tight text-ivory"
        >
          {headline}
        </h2>
        <p className="mt-3 text-pretty text-[0.98rem] leading-relaxed text-ivory/85">{body}</p>
        {surface !== 'standalone' ? (
          <p className="mt-2 text-[0.9rem] text-ink-muted">
            <em className="font-display text-gold-bright not-italic">{offer.title}</em> —{' '}
            {offer.promise}
          </p>
        ) : null}

        {status === 'success' ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 rounded-sm border border-gold/50 bg-gold/10 px-4 py-4 text-[0.98rem] text-ivory"
          >
            {message}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {/* Honeypot: hidden from readers and from assistive technology. */}
            <div aria-hidden="true" className="hidden">
              <label htmlFor={`${emailId}-hp`}>Leave this field empty</label>
              <input
                id={`${emailId}-hp`}
                type="text"
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor={`${emailId}-first`} className="block text-sm text-ink-muted">
                First name <span className="text-ink-muted/70">(optional)</span>
              </label>
              <input
                id={`${emailId}-first`}
                name="first_name"
                type="text"
                autoComplete="given-name"
                className="tap-target mt-1.5 w-full rounded-sm border border-line bg-charcoal px-4 py-3 text-ivory placeholder:text-ink-muted/60"
              />
            </div>

            <div>
              <label htmlFor={emailId} className="block text-sm text-ink-muted">
                Email address
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                aria-describedby={status === 'error' ? `${emailId}-error` : undefined}
                aria-invalid={status === 'error' ? true : undefined}
                className="tap-target mt-1.5 w-full rounded-sm border border-line bg-charcoal px-4 py-3 text-ivory placeholder:text-ink-muted/60"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id={consentId}
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked);
                  if (event.target.checked) setConsentError(false);
                }}
                aria-invalid={consentError || undefined}
                // 24px square: the WCAG 2.2 AA minimum target size.
                className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-gold)]"
              />
              <label htmlFor={consentId} className="text-sm leading-relaxed text-ivory/85">
                Yes, send me the bonus scene and occasional emails about new Reese Astor releases.
                These books are for adult readers. Unsubscribe any time. See the{' '}
                <a href="/privacy" className="text-gold underline underline-offset-2">
                  privacy notice
                </a>
                .
              </label>
            </div>

            {status === 'error' ? (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="rounded-sm border border-burgundy/70 bg-burgundy/20 px-4 py-3 text-[0.92rem] text-ivory"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="tap-target w-full rounded-sm bg-gold px-6 py-4 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {status === 'submitting' ? 'Sending…' : ctaLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
