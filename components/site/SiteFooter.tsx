import Link from 'next/link';

const YEAR = new Date().getFullYear();

/**
 * The footer sits below every CTA, so its links cost nothing in the funnel. On
 * paid pages it drops to the legally required minimum.
 */
export function SiteFooter({ minimal = false }: { minimal?: boolean }) {
  return (
    <footer className="border-t border-line bg-charcoal px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {!minimal ? (
          <nav aria-label="Footer" className="mb-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[0.85rem] text-ink-muted">
              <li>
                <Link href="/books" className="tap-target inline-flex items-center hover:text-gold">
                  All books
                </Link>
              </li>
              <li>
                <Link
                  href="/hudson-dynasty"
                  className="tap-target inline-flex items-center hover:text-gold"
                >
                  Hudson Dynasty
                </Link>
              </li>
              <li>
                <Link
                  href="/golden-parachute"
                  className="tap-target inline-flex items-center hover:text-gold"
                >
                  Golden Parachute
                </Link>
              </li>
              <li>
                <Link href="/contact" className="tap-target inline-flex items-center hover:text-gold">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}

        <p className="max-w-2xl text-[0.82rem] leading-relaxed text-ink-muted">
          Reese Astor writes adult contemporary romance containing explicit consensual intimacy and
          serious medical and recovery themes. These books are intended for readers 18 and older.
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-ink-muted">
          <li>
            <Link href="/privacy" className="tap-target inline-flex items-center hover:text-gold">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className="tap-target inline-flex items-center hover:text-gold">
              Cookies &amp; analytics
            </Link>
          </li>
          <li>
            <Link href="/contact" className="tap-target inline-flex items-center hover:text-gold">
              Contact
            </Link>
          </li>
        </ul>

        <p className="mt-6 text-[0.78rem] leading-relaxed text-ink-muted/80">
          © {YEAR} Reese Astor. All rights reserved. Amazon, Kindle and Kindle Unlimited are
          trademarks of Amazon.com, Inc. or its affiliates. This site is not endorsed by or
          affiliated with Amazon.
        </p>
      </div>
    </footer>
  );
}
