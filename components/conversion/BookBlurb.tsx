import type { Book } from '@/lib/content/types';

/** The synopsis. Set narrow, at a readable size, with the short beats given air. */
export function BookBlurb({ book, paragraphs }: { book: Book; paragraphs: string[] }) {
  const copy = paragraphs.length > 0 ? paragraphs : book.longBlurb;
  if (copy.length === 0) return null;

  return (
    <section aria-labelledby="synopsis-heading" className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold">The story</p>
        <h2 id="synopsis-heading" className="sr-only">
          {book.title} synopsis
        </h2>

        <div className="mt-7 space-y-5">
          {copy.map((paragraph, index) => {
            // The three one-line beats carry the rhythm of the blurb; they get
            // display type so the page reads the way the copy is written.
            const isBeat = paragraph.length < 70;
            return (
              <p
                key={index}
                className={
                  isBeat
                    ? 'font-display text-[1.4rem] leading-snug text-gold-bright'
                    : 'text-pretty text-[1.05rem] leading-[1.75] text-ivory/90'
                }
              >
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
