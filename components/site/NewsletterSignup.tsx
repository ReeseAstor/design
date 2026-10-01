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

  return (
    <section
      aria-labelledby="newsletter-signup-heading"
      className="border-t border-line px-5 py-14 sm:px-8"
    >
      <div className="mx-auto max-w-2xl rounded-sm border border-line bg-graphite/50 p-6 sm:p-8">
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold">Reader list</p>
        <h2
          id="newsletter-signup-heading"
          className="mt-3 text-balance font-display text-[1.65rem] leading-tight text-ivory"
        >
          {headline}
        </h2>
        <p className="mt-3 text-pretty text-[0.98rem] leading-relaxed text-ivory/85">{body}</p>

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
                className="tap-target mt-1.5 w-full rounded-sm border border-line bg-charcoal px-4 py-3 text-ivory"
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
                className="tap-target mt-1.5 w-full rounded-sm border border-line bg-charcoal px-4 py-3 text-ivory"
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
                className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-gold)]"
              />
              <label htmlFor={consentId} className="text-sm leading-relaxed text-ivory/85">
                Yes, send me occasional emails about new Reese Astor releases. Unsubscribe any time.
                See the{' '}
                <a href="/privacy" className="text-gold underline underline-offset-2">
                  privacy notice
                </a>
                .
              </label>
            </div>

            {status === 'error' ? (
              <p role="alert" className="rounded-sm border border-burgundy/70 bg-burgundy/20 px-4 py-3 text-[0.92rem] text-ivory">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="tap-target w-full rounded-sm bg-gold px-6 py-4 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'submitting' ? 'Sending...' : 'Join the reader list'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
