import Link from 'next/link';
import { FreeBookMagnet } from '@/components/site/FreeBookMagnet';

/** Organic pages: a quiet publisher bar. The brick control is the free book only. */
export function SiteHeader() {
  return (
    <header className="border-b border-ink bg-canvas">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-8"
      >
        <Link
          href="/"
          className="tap-target inline-flex items-center font-display text-[1.375rem] leading-none text-ink"
        >
          Reese Astor
        </Link>
        <ul className="flex items-center gap-3 font-sans text-[0.75rem] uppercase tracking-[0.12em] text-ink sm:gap-5 sm:text-[0.8125rem]">
          <li className="hidden sm:list-item">
            <Link href="/start-here" className="tap-target inline-flex items-center hover:border-b hover:border-gold">
              Start Here
            </Link>
          </li>
          <li>
            <Link href="/books" className="tap-target inline-flex items-center hover:border-b hover:border-gold">
              Books
            </Link>
          </li>
          <li className="hidden md:list-item">
            <Link
              href="/hudson-dynasty"
              className="tap-target inline-flex items-center hover:border-b hover:border-gold"
            >
              <span className="sm:hidden">Series</span>
              <span className="hidden sm:inline">Hudson Dynasty</span>
            </Link>
          </li>
          <li>
            <FreeBookMagnet variant="header" />
          </li>
        </ul>
      </nav>
    </header>
  );
}

/**
 * Paid campaign pages get a wordmark and nothing else. It is not a link: there
 * is no navigation above the first CTA on traffic we paid for.
 */
export function MinimalHeader() {
  return (
    <header
      data-testid="minimal-header"
      className="border-b border-ink bg-canvas px-5 py-3.5 text-center sm:px-8"
    >
      <p className="font-display text-[1.125rem] text-ink">Reese Astor</p>
    </header>
  );
}
