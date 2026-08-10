import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { GP_BRAND_MESSAGE } from '@/lib/content/golden-parachute';

export const metadata: Metadata = {
  title: 'About Reese Astor',
  description:
    'Reese Astor writes contemporary billionaire romance where money is a real force and recovery is real work.',
  alternates: { canonical: '/about' },
};

/** Target of the legacy /about.html redirect. */
export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 py-14 sm:px-8">
        <article className="mx-auto max-w-2xl">
          <h1 className="font-display text-[length:var(--text-section)] leading-tight">
            About Reese Astor
          </h1>

          <div className="mt-7 space-y-5 text-pretty text-[1.05rem] leading-[1.75] text-ivory/85">
            <p>
              Reese Astor writes contemporary romance about people with too much money and people
              with too little, and what happens when they want each other anyway.
            </p>
            <p>
              The Hudson Dynasty and Manhattan Money Kings novels take wealth seriously as a force
              in a relationship — what it buys, what it cannot, and the particular loneliness of
              being able to solve every problem except the one in your own chest. The heroines are
              not rescued. The heroes do not get to perform a recovery for an audience of one.
            </p>
            <p>
              Every book ends with a hard-won happily-ever-after, explicit consensual intimacy, and
              content notes on the page so readers can choose deliberately.
            </p>
          </div>

          <p className="mt-10 font-display text-[1.3rem] leading-snug text-gold-bright">
            {GP_BRAND_MESSAGE}
          </p>

          <p className="mt-10">
            <Link
              href="/golden-parachute"
              className="tap-target inline-flex items-center text-gold underline underline-offset-4 hover:text-gold-bright"
            >
              Read about the new book, Golden Parachute
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
