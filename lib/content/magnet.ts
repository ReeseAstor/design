/**
 * Canonical free-book magnet (First Acquisition).
 *
 * Primary BookFunnel URL matches the live manus home CTA
 * ("Get The First Acquisition Free" → dl.bookfunnel.com/kw1yge3479).
 * Alternate funnel and short links are documented for ops, not used as primary CTA.
 */

export const FIRST_ACQUISITION_SLUG = 'the-first-acquisition';
export const FIRST_ACQUISITION_TITLE = 'The First Acquisition';

/** Primary free download funnel used on the live manus site. */
export const BOOKFUNNEL_PRIMARY_URL = 'https://dl.bookfunnel.com/kw1yge3479';

/** Alternate BookFunnel delivery page (exclusive prequel wording). */
export const BOOKFUNNEL_ALTERNATE_URL = 'https://dl.bookfunnel.com/xrodg0t77p';

/** Short link sometimes used in promo; resolves to Amazon, not BookFunnel. */
export const FIRST_ACQUISITION_SHORT_LINK = 'https://swiy.co/05';

export const MAGNET_CTA_LABEL = 'Claim your free book';
export const MAGNET_START_HERE_LABEL = 'Start Here';
export const MAGNET_EYEBROW = 'Free for new readers';
export const MAGNET_HOOK =
  'A darker corporate romance prequel with fake engagement tension, forensic scandal, boardroom warfare, and a morally gray billionaire hero.';
export const MAGNET_PROMISE =
  'Get The First Acquisition free via BookFunnel — instant download, no Kindle Unlimited required.';

export const READING_ORDER = [
  {
    slug: 'the-first-acquisition',
    title: 'The First Acquisition',
    seriesOrder: 0,
    note: 'Free prequel · start here',
    free: true,
  },
  {
    slug: 'hostile-tender',
    title: 'Hostile Tender',
    seriesOrder: 1,
    note: 'Hudson Dynasty Book 1',
    free: false,
  },
  {
    slug: 'poison-pill',
    title: 'Poison Pill',
    seriesOrder: 2,
    note: 'Hudson Dynasty Book 2',
    free: false,
  },
  {
    slug: 'golden-parachute',
    title: 'Golden Parachute',
    seriesOrder: 3,
    note: 'Hudson Dynasty Book 3 · coming soon',
    free: false,
  },
] as const;
