import Link from 'next/link';
import { FreeBookMagnet } from '@/components/site/FreeBookMagnet';

/** Organic pages get a minimal header — wordmark, destinations, and the free-book magnet. */
export function SiteHeader() {
  return (
    <header className="border-b border-line/70">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-8"
      >
        <Link
          href="/"
          className="tap-target inline-flex items-center font-display text-lg tracking-[0.16em] text-ivory uppercase"
        >
          Reese Astor
        </Link>
        <ul className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-ink-muted sm:gap-5 sm:text-[0.82rem] sm:tracking-[0.14em]">
          <li className="hidden sm:list-item">
            <Link href="/start-here" className="tap-target inline-flex items-center hover:text-gold">
              Start Here
            </Link>
          </li>
          <li>
            <Link href="/books" className="tap-target inline-flex items-center hover:text-gold">
              Books
            </Link>
          </li>
          <li className="hidden md:list-item">
            <Link
              href="/hudson-dynasty"
              className="tap-target inline-flex items-center hover:text-gold"
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
      className="border-b border-line/50 px-5 py-3.5 text-center sm:px-8"
    >
      <p className="font-display text-[0.95rem] uppercase tracking-[0.3em] text-ink-muted">
        Reese Astor
      </p>
    </header>
  );
}
