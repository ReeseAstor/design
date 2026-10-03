import Link from 'next/link';
import { FreeBookMagnet } from '@/components/site/FreeBookMagnet';

const YEAR = new Date().getFullYear();

const linkClass =
  'tap-target inline-flex items-center border-b border-transparent text-ink hover:border-gold';

/**
 * The footer sits below every CTA, so its links cost nothing in the funnel. On
 * paid pages it drops to the legally required minimum.
 */
export function SiteFooter({ minimal = false }: { minimal?: boolean }) {
  return (
    <footer className="border-t border-ink bg-paper px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {!minimal ? (
          <nav aria-label="Footer" className="mb-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-[0.875rem] text-ink">
              <li>
                <FreeBookMagnet variant="footer" />
              </li>
              <li>
                <Link href="/books" className={linkClass}>
                  All books
                </Link>
              </li>
              <li>
                <Link href="/booklist" className={linkClass}>
                  Booklist
                </Link>
              </li>
              <li>
                <Link href="/hudson-dynasty" className={linkClass}>
                  Hudson Dynasty
                </Link>
              </li>
              <li>
                <Link href="/golden-parachute" className={linkClass}>
                  Golden Parachute
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}

        <p className="max-w-2xl font-sans text-[0.875rem] leading-relaxed text-quiet">
          Reese Astor writes adult contemporary romance containing explicit consensual intimacy and
          serious medical and recovery themes. These books are intended for readers 18 and older.
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[0.875rem]">
          <li>
            <Link href="/privacy" className={linkClass}>
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className={linkClass}>
              Cookies &amp; analytics
            </Link>
          </li>
          <li>
            <Link href="/contact" className={linkClass}>
              Contact
            </Link>
          </li>
        </ul>

        <p className="mt-6 font-sans text-[0.75rem] leading-relaxed text-quiet">
          © {YEAR} Reese Astor. All rights reserved. Amazon, Kindle and Kindle Unlimited are
          trademarks of Amazon.com, Inc. or its affiliates. This site is not endorsed by or
          affiliated with Amazon.
        </p>
      </div>
    </footer>
  );
}
