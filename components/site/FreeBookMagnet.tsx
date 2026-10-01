import Link from 'next/link';
import {
  BOOKFUNNEL_PRIMARY_URL,
  MAGNET_CTA_LABEL,
  MAGNET_START_HERE_LABEL,
} from '@/lib/content/magnet';

type MagnetVariant = 'header' | 'footer' | 'inline' | 'hero';

interface FreeBookMagnetProps {
  variant?: MagnetVariant;
  /** When true, primary action is an external BookFunnel claim. Otherwise → /start-here. */
  directClaim?: boolean;
  className?: string;
}

/**
 * Sitewide free-book magnet. Header/footer use a compact Start Here path;
 * hero/inline can deep-link straight to BookFunnel.
 */
export function FreeBookMagnet({
  variant = 'inline',
  directClaim = false,
  className = '',
}: FreeBookMagnetProps) {
  const href = directClaim ? BOOKFUNNEL_PRIMARY_URL : '/start-here';
  const external = directClaim;
  const label = directClaim || variant === 'hero' ? MAGNET_CTA_LABEL : MAGNET_START_HERE_LABEL;

  const base =
    variant === 'header'
      ? 'tap-target inline-flex items-center rounded-sm bg-gold px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-charcoal transition-colors duration-150 hover:bg-gold-bright sm:px-4 sm:text-[0.78rem]'
      : variant === 'footer'
        ? 'tap-target inline-flex items-center text-gold underline underline-offset-4 hover:text-gold-bright'
        : variant === 'hero'
          ? 'tap-target inline-flex items-center justify-center rounded-sm bg-gold px-7 py-4 text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright motion-reduce:transition-none'
          : 'tap-target inline-flex items-center justify-center rounded-sm bg-gold px-6 py-3.5 text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-charcoal transition-colors duration-150 hover:bg-gold-bright';

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-magnet="bookfunnel"
        data-magnet-variant={variant}
        className={`${base} ${className}`.trim()}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      data-magnet="start-here"
      data-magnet-variant={variant}
      className={`${base} ${className}`.trim()}
    >
      {label}
    </Link>
  );
}
