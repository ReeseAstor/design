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
 * Sitewide free-book magnet.
 * The filled fire-brick control is the one borrowed CTA. Footer stays a ghost link.
 */
export function FreeBookMagnet({
  variant = 'inline',
  directClaim = false,
  className = '',
}: FreeBookMagnetProps) {
  const href = directClaim ? BOOKFUNNEL_PRIMARY_URL : '/start-here';
  const external = directClaim;
  const label = directClaim || variant === 'hero' ? MAGNET_CTA_LABEL : MAGNET_START_HERE_LABEL;

  const filled =
    'tap-target inline-flex items-center justify-center rounded-none bg-brick px-7 py-3.5 font-sans text-[0.875rem] font-normal text-canvas transition-opacity duration-150 hover:opacity-90 motion-reduce:transition-none';
  const filledCompact =
    'tap-target inline-flex items-center justify-center rounded-none bg-brick px-3 py-2 font-sans text-[0.75rem] font-normal text-canvas transition-opacity duration-150 hover:opacity-90 sm:px-4';
  const ghost =
    'tap-target inline-flex items-center border-b border-gold bg-transparent font-sans text-[0.875rem] text-ink no-underline hover:border-ink';

  const base =
    variant === 'header' ? filledCompact : variant === 'footer' ? ghost : variant === 'hero' ? filled : filled;

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
