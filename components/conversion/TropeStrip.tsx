import type { Trope } from '@/lib/content/types';

/**
 * Trope confirmation. A romance reader arriving from an ad is asking one
 * question — "is this the thing I was promised?" — and these cards answer it
 * before the synopsis asks for a longer commitment.
 */

export function TropeTeaser({ labels }: { labels: string[] }) {
  return (
    <p className="text-[0.78rem] uppercase tracking-[0.2em] text-gold-bright">
      {labels.join(' • ')}
    </p>
  );
}

export function TropeStrip({ tropes }: { tropes: Trope[] }) {
  if (tropes.length === 0) return null;

  return (
    <section aria-labelledby="tropes-heading" className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">
          What you are getting
        </p>
        <h2
          id="tropes-heading"
          className="mt-5 max-w-2xl text-balance text-[length:var(--text-section)] leading-[1.15]"
        >
          A love story about wanting more—and learning not to disappear for it.
        </h2>

        <ul className="mt-9 grid gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-2 lg:grid-cols-3">
          {tropes.map((trope) => (
            <li key={trope.label} className="bg-graphite p-6">
              <h3 className="font-display text-xl text-gold-bright">{trope.label}</h3>
              <p className="mt-2.5 text-pretty text-[0.95rem] leading-relaxed text-ivory/85">
                {trope.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
