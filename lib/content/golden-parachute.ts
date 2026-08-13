/**
 * Canonical Golden Parachute marketing copy.
 *
 * This module is the single source of truth for the launch copy in seed-content
 * mode, and `scripts/seed-catalog.ts` writes exactly these strings into Sanity so
 * that editors start from the approved text rather than a paraphrase of it.
 */

import type { NewsletterOffer, SecondaryOffer, Trope } from './types';

export const GOLDEN_PARACHUTE_SLUG = 'golden-parachute';
export const SERIES_ENTRY_SLUG = 'the-first-acquisition';
export const HUDSON_DYNASTY = 'Hudson Dynasty';

export const GP_TITLE = 'Golden Parachute';
export const GP_SERIES_LINE = 'A Hudson Dynasty Novel · Book Three';
export const GP_SERIES_LINE_COMPACT = 'Hudson Dynasty · Book 3';

export const GP_HOOK_LINE_ONE = 'He built his life to control every outcome.';
export const GP_HOOK_LINE_TWO = 'She refuses to become another thing he can buy.';
export const GP_PRIMARY_HOOK = `${GP_HOOK_LINE_ONE}\n${GP_HOOK_LINE_TWO}`;

export const GP_POSITIONING_LINE =
  'An adult contemporary romance featuring a feverish billionaire, a fiercely independent nursing student, forced proximity, emotional boundary work, and a recovery journey neither character can survive alone.';

export const GP_ROMANCE_PROMISE =
  'A love story about wanting more—and learning not to disappear for it.';

export const GP_BRAND_MESSAGE =
  'Love is not a rescue plan. It is a choice two whole people make again and again.';

export const GP_PRICE_USD = 4.99;

/** Control CTA copy for the gp_hero_value_proposition experiment. */
export const GP_CTA_LABEL = 'Read Golden Parachute — $4.99';
export const GP_KU_SUPPORT_LINE = 'Also available with Kindle Unlimited';

export const GP_TROPES: Trope[] = [
  {
    label: 'Billionaire Romance',
    description:
      'Kai Hsu has money, influence, and no idea how to remain present when intimacy becomes real.',
  },
  {
    label: 'Caregiver Heroine',
    description:
      'Miri Doyle-Levine has spent her life keeping everyone else alive. She refuses to lose herself in the process.',
  },
  {
    label: 'Forced Proximity',
    description:
      'Gala rooms, family apartments, hospital corridors, and New York streets keep pushing them together.',
  },
  {
    label: 'High Heat',
    description:
      'Their chemistry is immediate, explicit, consensual, and governed by clear boundaries.',
  },
  {
    label: 'Recovery Journey',
    description:
      'Desire cannot repair compulsive behavior. Honesty, treatment, and accountability must do that work.',
  },
  {
    label: 'Class Difference',
    description:
      'Manhattan wealth meets Brooklyn resilience in a romance where love cannot be purchased.',
  },
];

/** Short trope labels for the above-the-fold strip. */
export const GP_TROPE_TEASER = ['Billionaire', 'Forced Proximity', 'High Heat'];

export const GP_SYNOPSIS: string[] = [
  'Miri Doyle-Levine knows how to manage a crisis.',
  'She knows how to keep an elderly client breathing, stretch a paycheck across impossible bills, protect her family, and hide the exhaustion behind a professional smile. What she does not know is how to accept help without surrendering control of her life.',
  'Kai Hsu knows how to buy time.',
  'A brilliant finance executive with a private history of hunger, shame, and compulsive sexual behavior, Kai has built a perfect life designed to keep need outside the door. Then Miri sees through him at a Manhattan donor reception—and refuses to be impressed by his money.',
  'Their attraction is immediate. Their boundaries are not.',
  'As Kai’s health collapses and his carefully controlled life begins to unravel, Miri must decide whether love can exist without becoming another unpaid caregiving job. Kai must learn that recovery cannot be performed for the woman he wants. It must be chosen when nobody is watching.',
  'Golden Parachute is an adult contemporary romance featuring explicit consensual intimacy, a caregiver heroine, a billionaire hero, emotional boundary work, a serious medical crisis, and a hard-won happily-ever-after.',
];

export const GP_CONTENT_NOTES: string[] = [
  'Adult and explicit consensual intimacy',
  'Serious medical crisis',
  'Pneumonia and sepsis themes',
  'Compulsive sexual behavior and recovery',
  'Caregiving stress',
  'Family and financial pressure',
];

export const GP_CONTENT_NOTES_INTRO =
  'Golden Parachute treats illness and recovery as real work, not as romantic decoration. These notes are here so you can choose this book deliberately.';

export const GP_SERIES_ENTRY_OFFER: SecondaryOffer = {
  eyebrow: 'New to Hudson Dynasty?',
  headline: 'Start with Book 0 for $0.99',
  body: 'The First Acquisition is the short, sharp entry point to the Hudson family — read it first if you want the full weight of what happens to Kai.',
  ctaLabel: 'Start with Book 0 for $0.99',
  bookSlug: SERIES_ENTRY_SLUG,
  format: 'ebook',
};

export const GP_NEWSLETTER_OFFER: NewsletterOffer = {
  offerId: 'morning_after',
  title: 'The Morning After the Parachute',
  ctaLabel: 'Get the exclusive Hudson Dynasty bonus scene',
  promise:
    'A fragile first morning with emotional intimacy, light domestic humor, Kai’s recovery work, and Miri practicing boundaries.',
  recoveryHeadline: 'Not ready to start Kai and Miri yet?',
  recoveryBody:
    'Read an exclusive Hudson Dynasty scene and decide if they’re your kind of trouble.',
  recoveryCtaLabel: 'Get the bonus scene',
  returningHeadline: 'Welcome back to the Hudsons.',
  returningBody:
    'While you read, take the exclusive bonus scene — the morning after, in Kai’s apartment, with nobody performing anything.',
};

export const GP_SEO_TITLE =
  'Golden Parachute — Hudson Dynasty Book 3 | Reese Astor';

export const GP_SEO_DESCRIPTION =
  'He built his life to control every outcome. She refuses to become another thing he can buy. Golden Parachute is an adult contemporary romance by Reese Astor: billionaire hero, caregiver heroine, forced proximity, and a recovery journey neither can survive alone.';

/** Copy shown while the title has no live Amazon destination. */
export const GP_PRELAUNCH_EYEBROW = 'Coming soon';
export const GP_PRELAUNCH_HEADLINE = 'Golden Parachute is not on sale yet.';
export const GP_PRELAUNCH_BODY =
  'The moment Kai and Miri are live on Amazon, the readers on Reese’s list hear first. Until then, start the series with Book 0 or take the bonus scene.';
