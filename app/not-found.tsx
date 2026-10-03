import Link from 'next/link';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-ink">404</p>
          <h1 className="mt-5 font-display text-[length:var(--text-section)] leading-tight">
            That page isn’t here.
          </h1>
          <p className="mt-4 text-ink">
            The link may be old, or the book may have moved to its own page.
          </p>
          <Link
            href="/golden-parachute"
            className="tap-target mt-8 inline-flex items-center justify-center rounded-none border border-ink px-7 py-3.5 font-sans text-[0.875rem] text-ink hover:border-gold"
          >
            Go to Golden Parachute
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
