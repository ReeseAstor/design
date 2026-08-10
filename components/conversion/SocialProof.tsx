'use client';

/**
 * Verified social proof only.
 *
 * The section renders nothing at all unless Sanity holds an approved item. No
 * star row, no review count, no "readers are saying" — an unverified proof
 * element on a book page is a claim about strangers we have not earned.
 */

import { captureEvent } from '@/components/analytics/PostHogProvider';
import { checkAmazonDestination } from '@/lib/amazon/allowlist';
import type { SocialProofItem, TrafficSource } from '@/lib/content/types';

interface SocialProofProps {
  items: SocialProofItem[];
  campaignId: string;
  bookSlug: string;
  trafficSource: TrafficSource | null;
}

function Rating({ item }: { item: SocialProofItem }) {
  // A rating renders only with both a value and the scale it was measured on.
  if (item.rating === null || item.ratingScale === null) return null;

  const label =
    item.reviewCount !== null
      ? `${item.rating} out of ${item.ratingScale}, from ${item.reviewCount.toLocaleString('en-US')} verified reviews`
      : `${item.rating} out of ${item.ratingScale}`;

  return (
    <p className="mt-3 text-sm text-gold-bright">
      <span aria-hidden="true">
        {item.rating}/{item.ratingScale}
        {item.reviewCount !== null ? ` · ${item.reviewCount.toLocaleString('en-US')} reviews` : ''}
      </span>
      <span className="sr-only">{label}</span>
    </p>
  );
}

export function SocialProof({ items, campaignId, bookSlug, trafficSource }: SocialProofProps) {
  const approved = items.filter((item) => item.approved === true && item.quote?.trim());
  if (approved.length === 0) return null;

  return (
    <section aria-labelledby="proof-heading" className="border-y border-line bg-graphite/40 px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 id="proof-heading" className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
          Verified reader response
        </h2>

        <ul className="mt-8 grid gap-8 sm:grid-cols-2">
          {approved.map((item) => {
            const link = checkAmazonDestination(item.sourceUrl);
            return (
              <li key={item._id}>
                <figure>
                  <blockquote className="font-display text-[1.35rem] leading-snug text-ivory">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-3 text-sm text-ink-muted">
                    {item.displayName ? <span>{item.displayName}</span> : null}
                    {item.displayName && item.sourceName ? <span aria-hidden="true"> · </span> : null}
                    {item.sourceName ? <span>{item.sourceName}</span> : null}
                  </figcaption>
                  <Rating item={item} />
                  {link.ok ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={() =>
                        captureEvent('review_click', {
                          campaign_id: campaignId,
                          book_id: bookSlug,
                          traffic_source: trafficSource,
                          proof_id: item._id,
                        })
                      }
                      className="tap-target mt-3 inline-flex items-center text-sm text-gold underline underline-offset-4 hover:text-gold-bright"
                    >
                      Read the review
                    </a>
                  ) : null}
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
