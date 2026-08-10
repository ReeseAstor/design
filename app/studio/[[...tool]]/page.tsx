import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';
import { isSanityConfigured } from '@/lib/config';

/**
 * The embedded Studio. Never indexed, and never rendered without a project ID —
 * mounting it unconfigured throws inside the Studio bundle, which is a worse
 * message than this one.
 */

export const dynamic = 'force-static';
export const metadata = {
  title: 'Studio',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  if (!isSanityConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-ivory">
        <h1 className="font-display text-3xl">Studio is not configured</h1>
        <p className="mt-4 leading-relaxed text-ivory/85">
          Set <code className="text-gold">NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{' '}
          <code className="text-gold">NEXT_PUBLIC_SANITY_DATASET</code> in your environment, then
          reload. Until then the site renders from the seed catalog in{' '}
          <code className="text-gold">data/catalog.seed.json</code>.
        </p>
      </main>
    );
  }

  return <NextStudio config={config} />;
}
