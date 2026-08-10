import { GP_CONTENT_NOTES_INTRO } from '@/lib/content/golden-parachute';

/**
 * Content notes are placed before the final CTA, not hidden in a footer.
 *
 * They are written plainly. Pneumonia, sepsis and compulsive sexual behaviour
 * are conditions people live with, and a reader deciding whether to spend an
 * evening with this book deserves the list without euphemism.
 */
export function ContentNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;

  return (
    <section aria-labelledby="content-notes-heading" className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-2xl rounded-sm border border-line bg-graphite/50 p-6 sm:p-8">
        <h2
          id="content-notes-heading"
          className="rule-gold text-[0.7rem] uppercase tracking-[0.3em] text-gold"
        >
          Content notes
        </h2>
        <p className="mt-5 text-[0.95rem] leading-relaxed text-ivory/80">
          {GP_CONTENT_NOTES_INTRO}
        </p>
        <ul className="mt-5 space-y-2.5">
          {notes.map((note) => (
            <li key={note} className="flex gap-3 text-[0.95rem] leading-relaxed text-ivory/90">
              <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-gold" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
