import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';

/** Shared shell for the legal routes: narrow measure, generous leading. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-5 py-14 sm:px-8">
        <article className="mx-auto max-w-2xl">
          <h1 className="font-display text-[length:var(--text-section)] leading-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">Last updated {updated}</p>
          {intro ? (
            <p className="mt-6 text-pretty text-[1.02rem] leading-relaxed text-ivory/85">{intro}</p>
          ) : null}
          <div className="mt-8 space-y-8">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl text-gold-bright">{heading}</h2>
      <div className="mt-3 space-y-3 text-pretty leading-relaxed text-ivory/85">{children}</div>
    </section>
  );
}
