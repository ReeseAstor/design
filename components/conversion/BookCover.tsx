import Image from 'next/image';
import type { Book, BookFormatRecord } from '@/lib/content/types';

/**
 * Cover rendering, in strict order of trustworthiness:
 *
 *   1. The Sanity-hosted asset uploaded by scripts/import-cover-assets.ts.
 *   2. In development only, the Amazon SL1500 source URL.
 *   3. A CSS-only placeholder.
 *
 * A title with no approved cover — Golden Parachute, today — always lands on the
 * placeholder. Substituting another book's art would misrepresent the product.
 */

interface BookCoverProps {
  book: Book;
  format: BookFormatRecord | null;
  priority?: boolean;
  className?: string;
  /** Rendered width hint for the responsive `sizes` attribute. */
  sizes?: string;
}

const ASPECT = { width: 1000, height: 1500 };

export function BookCover({
  book,
  format,
  priority = false,
  className = '',
  sizes = '(max-width: 640px) 62vw, 320px',
}: BookCoverProps) {
  const sanityUrl = format?.coverAsset?.url ?? null;
  const devFallbackUrl =
    !sanityUrl && process.env.NODE_ENV !== 'production' ? (format?.coverSourceUrl ?? null) : null;
  const src = sanityUrl ?? devFallbackUrl;

  const width = format?.coverAsset?.width ?? format?.sourceWidth ?? ASPECT.width;
  const height = format?.coverAsset?.height ?? format?.sourceHeight ?? ASPECT.height;

  // The wrapper owns the aspect ratio so the box is laid out before the image
  // byte arrives — this is what keeps CLS at zero while the cover loads.
  const frame = `relative overflow-hidden rounded-[3px] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] ${className}`;

  if (!src) {
    return (
      <div
        className={frame}
        style={{ aspectRatio: `${ASPECT.width} / ${ASPECT.height}` }}
        data-testid="cover-placeholder"
      >
        <div className="cover-placeholder flex h-full w-full flex-col items-center justify-center gap-3 px-5 text-center">
          <span className="text-[0.6rem] uppercase tracking-[0.32em] text-gold">
            Cover coming soon
          </span>
          <span className="font-display text-[clamp(1.35rem,5.4vw,1.9rem)] leading-[1.1] text-ivory">
            {book.title}
          </span>
          <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-ink-muted">
            {book.author}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={frame} style={{ aspectRatio: `${width} / ${height}` }}>
      <Image
        src={src}
        alt={`${book.title} by ${book.author} — book cover`}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        // Only the active hero cover is eager; catalog grids stay lazy.
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
