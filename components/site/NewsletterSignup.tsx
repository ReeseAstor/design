'use client';

/**
 * Lightweight MailerLite-backed newsletter UI for organic IA pages.
 * Posts to /api/newsletter; builds safely when MAILERLITE_API_TOKEN is unset (mock mode).
 */

import { useId, useState } from 'react';
import { HONEYPOT_FIELD } from '@/lib/validation/newsletter';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterSignupProps {
  headline: string;
  body: string;
  bookInterest?: string;
  offerId?: string;
  sourceUrl?: string;
  campaignId?: string;
}

export function NewsletterSignup({
  headline,
  body,
  bookInterest = '',
  offerId = 'sitewide',
  sourceUrl = '/start-here',
  campaignId = '',
}: NewsletterSignupProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const emailId = useId();
  const consentId = useId();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!consent) {
      setStatus('error');
      setMessage("Please confirm you want Reese's reader emails.");
      return;
    }

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
          book_interest: bookInterest,
          offer_id: offerId,
          source_url: sourceUrl,
          [HONEYPOT_FIELD]: String(data.get(HONEYPOT_FIELD) ?? ''),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setStatus('error');
        setMessage(payload?.message ?? 'That did not go through. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(payload?.message ?? "You're on the list - check your inbox.");
      form.reset();
      setConsent(false);
    } catch {
      setStatus('error');
      setMessage('We could not reach the reader list. Please try again in a moment.');
    }
  }

  const fieldClass =
    'tap-target mt-2 w-full rounded-none border-0 border-b border-ink bg-transparent px-0 py-2 text-ink outline-none';

  return (
    <section
      aria-labelledby="newsletter-signup-heading"
      className="border-t border-ink bg-paper px-5 py-12 sm:px-8"
    >
      <div className="mx-auto max-w-xl">
        <p className="rule-gold font-sans text-[0.75rem] uppercase tracking-[0.14em] text-ink">
          Reader list
        </p>
        <h2
          id="newsletter-signup-heading"
          className="mt-4 text-balance font-display text-[1.375rem] leading-[0.95] text-ink"
        >
          {headline}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-[1rem] leading-[1.25] text-ink">{body}</p>

        {status === 'success' ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 border border-ink px-4 py-4 text-[1rem] text-ink"
          >
            {message}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
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
              <label htmlFor={`${emailId}-first`} className="block font-sans text-[0.875rem] text-quiet">
                First name <span className="text-quiet">(optional)</span>
              </label>
              <input
                id={`${emailId}-first`}
                name="first_name"
                type="text"
                autoComplete="given-name"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor={emailId} className="block font-sans text-[0.875rem] text-quiet">
                Email address
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className={fieldClass}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id={consentId}
                name="consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 rounded-none accent-[var(--color-brick)]"
              />
              <label htmlFor={consentId} className="font-sans text-[0.875rem] leading-relaxed text-ink">
                Yes, send me occasional emails about new Reese Astor releases. Unsubscribe any time.
                See the{' '}
                <a href="/privacy" className="border-b border-gold text-ink no-underline hover:border-ink">
                  privacy notice
                </a>
                .
              </label>
            </div>

            {status === 'error' ? (
              <p role="alert" className="border border-brick px-4 py-3 font-sans text-[0.875rem] text-ink">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="tap-target inline-flex items-center justify-center rounded-none bg-brick px-7 py-3.5 font-sans text-[0.875rem] font-normal text-canvas transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'submitting' ? 'Sending...' : 'Join the reader list'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
