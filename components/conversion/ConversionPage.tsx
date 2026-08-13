import { BookBlurb } from './BookBlurb';
import { BuyButton } from './BuyButton';
import { ContentNotes } from './ContentNotes';
import { ConversionHero } from './ConversionHero';
import { NewsletterOffer } from './NewsletterOffer';
import { PrelaunchNotice } from './PrelaunchNotice';
import { SeriesEntryOffer } from './SeriesEntryOffer';
import { SocialProof } from './SocialProof';
import { StickyBuyBar, STICKY_BAR_CLEARANCE } from './StickyBuyBar';
import { TropeStrip } from './TropeStrip';
import { EngagementTracker } from '@/components/analytics/EngagementTracker';
import { MinimalHeader, SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { GP_BRAND_MESSAGE } from '@/lib/content/golden-parachute';
import type { ConversionViewModel } from '@/lib/conversion/view-model';
import type { CtaPlacement } from '@/lib/content/types';

/**
 * The one conversion page.
 *
 * Section order is fixed for every campaign — hero, CTA, tropes, verified proof,
 * synopsis, CTA, Book 0, newsletter, content notes, final CTA — so that the only
 * difference between two campaigns is the campaign binding and the running
 * experiment. Anything else varying would make the results unreadable.
 */

function CtaBlock({
  model,
  placement,
  eyebrow,
}: {
  model: ConversionViewModel;
  placement: CtaPlacement;
  eyebrow?: string;
}) {
  if (!model.purchaseAvailable) {
    // The final slot still gets the honest prelaunch offer rather than nothing,
    // but the mid-page repeat is dropped so the page does not nag.
    if (placement !== 'footer') return null;
    return (
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-md">
          <PrelaunchNotice model={model} />
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-md text-center">
        {eyebrow ? (
          <p className="mb-5 font-display text-[1.35rem] leading-snug text-ivory">{eyebrow}</p>
        ) : null}
        <BuyButton
          bookSlug={model.book.slug}
          bookTitle={model.book.title}
          campaignId={model.campaign.campaignId}
          placement={placement}
          variant={model.variant}
          experimentKey={model.experimentKey}
          trafficSource={model.trafficSource}
          format={model.format}
          label={model.ctaLabel}
          supportingLine={model.ctaSupportingLine}
        />
      </div>
    </section>
  );
}

export function ConversionPage({ landingPage: model }: { landingPage: ConversionViewModel }) {
  const { landingPage: page, book } = model;
  const sourceUrl = model.showSiteNavigation
    ? '/golden-parachute'
    : `/gp/${model.campaign.slug}`;

  const newsletterProps = page.newsletterOffer
    ? {
        offer: page.newsletterOffer,
        campaignId: model.campaign.campaignId,
        bookSlug: book.slug,
        trafficSource: model.trafficSource,
        sourceUrl,
        variant: model.variant,
        experimentKey: model.experimentKey,
      }
    : null;

  return (
    <>
      {/*
        Paid traffic gets no navigation above the first CTA. Every link in a
        header is a way out of the funnel that the campaign already paid for.
      */}
      {model.showSiteNavigation ? <SiteHeader /> : <MinimalHeader />}

      <main
        id="main"
        // Bottom padding clears the sticky mobile bar plus the safe-area inset,
        // so the last section is never trapped underneath it.
        style={{ paddingBottom: model.purchaseAvailable ? STICKY_BAR_CLEARANCE : undefined }}
      >
        {/* 1. Hero — carries the first CTA inside the opening viewport. */}
        <ConversionHero model={model} />

        {/* 2. Primary purchase CTA (repeat, for the reader who scrolled past). */}
        <CtaBlock model={model} placement="mid_blurb" eyebrow={page.romancePromise ?? undefined} />

        {/* 3. Trope confirmation. */}
        <TropeStrip tropes={page.tropeOrder.length > 0 ? page.tropeOrder : book.tropes} />

        {/* 4. Verified social proof — renders nothing unless approved content exists. */}
        <SocialProof
          items={model.socialProof}
          campaignId={model.campaign.campaignId}
          bookSlug={book.slug}
          trafficSource={model.trafficSource}
        />

        {/* 5. Synopsis. */}
        <BookBlurb book={book} paragraphs={book.longBlurb} />

        {/* 6. Primary purchase CTA. */}
        <CtaBlock model={model} placement="hero" />

        {/* 7. Book 0 series-entry offer. */}
        <SeriesEntryOffer model={model} />

        {/* 8. Newsletter recovery offer. */}
        {newsletterProps ? <NewsletterOffer {...newsletterProps} surface="standalone" /> : null}

        {/* 9. Content notes. */}
        <ContentNotes notes={book.contentNotes} />

        {/* 10. Final purchase CTA. */}
        <CtaBlock model={model} placement="footer" />

        <p className="mx-auto max-w-2xl px-5 pb-14 text-center font-display text-[1.3rem] leading-snug text-gold-bright sm:px-8">
          {GP_BRAND_MESSAGE}
        </p>

        {/*
          Funnel state. The recovery module is inserted here, below the last CTA
          and above the footer: inline, never a modal, never over the button.
        */}
        {newsletterProps ? (
          <EngagementTracker
            campaignId={model.campaign.campaignId}
            bookSlug={book.slug}
            trafficSource={model.trafficSource}
            experimentKey={model.experimentKey}
            variant={model.variant}
            bookFormat={model.format}
            initialReturningReader={model.returningReader}
            recoverySlot={<NewsletterOffer {...newsletterProps} surface="recovery" />}
            returningSlot={<NewsletterOffer {...newsletterProps} surface="returning" />}
          />
        ) : null}
      </main>

      <SiteFooter minimal={!model.showSiteNavigation} />

      {model.purchaseAvailable ? (
        <StickyBuyBar
          bookSlug={book.slug}
          bookTitle={book.title}
          campaignId={model.campaign.campaignId}
          variant={model.variant}
          experimentKey={model.experimentKey}
          trafficSource={model.trafficSource}
          format={model.format}
          priceUsd={model.priceUsd}
          kuEnabled={model.kuEnabled}
        />
      ) : null}
    </>
  );
}
