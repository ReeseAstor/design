import Link from 'next/link';

/** Organic pages get a minimal header — a wordmark and three destinations. */
export function SiteHeader() {
  return (
    <header className="border-b border-line/70">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
      >
        <Link
          href="/"
          className="tap-target inline-flex items-center font-display text-lg tracking-[0.16em] text-ivory uppercase"
        >
          Reese Astor
        </Link>
        <ul className="flex items-center gap-3 text-[0.78rem] uppercase tracking-[0.1em] text-ink-muted sm:gap-5 sm:text-[0.82rem] sm:tracking-[0.14em]">
          <li>
            <Link href="/books" className="tap-target inline-flex items-center hover:text-gold">
              Books
            </Link>
          </li>
          <li>
            <Link
              href="/hudson-dynasty"
              className="tap-target inline-flex items-center hover:text-gold"
            >
              {/* The full series name does not fit beside the wordmark at 320px. */}
              <span className="sm:hidden">Series</span>
              <span className="hidden sm:inline">Hudson Dynasty</span>
            </Link>
          </li>
          <li>
            <Link href="/contact" className="tap-target inline-flex items-center hover:text-gold">
              Contact
            </Link>
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
