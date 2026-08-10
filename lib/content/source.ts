/**
 * The one content API the application uses.
 *
 * Pages never talk to Sanity or to the seed files directly. They ask for a
 * landing-page bundle and get the same normalised shape either way, which is
 * what lets the entire site — including the Playwright suite — run with no
 * credentials at all.
 */

import 'server-only';
import { cache } from 'react';
import { isSanityConfigured } from '@/lib/config';
import { getSanityReadClient } from '@/lib/sanity/client';
import {
  allBooksQuery,
  bookBySlugQuery,
  booksBySeriesQuery,
  campaignByIdQuery,
  landingPageByCampaignQuery,
} from '@/lib/sanity/queries';
import {
  seedBookBySlug,
  seedBookList,
  seedCampaignById,
  seedLandingPage,
  normaliseKuEnabled,
} from './seed';
import { HUDSON_DYNASTY } from './golden-parachute';
import type { Book, Campaign, LandingPage, LandingPageBundle } from './types';

/** Guards against a CMS entry that marks a paperback or audiobook as KU. */
function normaliseBook(book: Book | null): Book | null {
  if (!book) return null;
  return {
    ...book,
    longBlurb: book.longBlurb ?? [],
    tropes: book.tropes ?? [],
    contentNotes: book.contentNotes ?? [],
    formats: (book.formats ?? []).map((format) => ({
      ...format,
      kuEnabled: normaliseKuEnabled(format.format, format.kuEnabled),
      active: format.active !== false,
    })),
  };
}

/** Only approved social proof is ever returned to a component. */
function normaliseLandingPage(page: LandingPage | null): LandingPage | null {
  if (!page) return null;
  return {
    ...page,
    tropeOrder: page.tropeOrder ?? [],
    socialProof: (page.socialProof ?? []).filter((item) => item?.approved === true),
  };
}

async function sanityFetch<T>(query: string, params: Record<string, unknown>): Promise<T | null> {
  const client = getSanityReadClient();
  if (!client) return null;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 300, tags: ['content'] },
    });
  } catch (error) {
    console.error('[content] Sanity fetch failed, falling back to seed content', error);
    return null;
  }
}

export const getBookBySlug = cache(async (slug: string): Promise<Book | null> => {
  if (isSanityConfigured()) {
    const book = await sanityFetch<Book | null>(bookBySlugQuery, { slug });
    if (book) return normaliseBook(book);
  }
  return normaliseBook(seedBookBySlug(slug));
});

export const getAllBooks = cache(async (): Promise<Book[]> => {
  if (isSanityConfigured()) {
    const books = await sanityFetch<Book[] | null>(allBooksQuery, {});
    if (books && books.length > 0) {
      return books.map(normaliseBook).filter((b): b is Book => b !== null);
    }
  }
  return seedBookList()
    .map(normaliseBook)
    .filter((b): b is Book => b !== null);
});

export const getBooksBySeries = cache(async (series: string): Promise<Book[]> => {
  if (isSanityConfigured()) {
    const books = await sanityFetch<Book[] | null>(booksBySeriesQuery, { series });
    if (books && books.length > 0) {
      return books.map(normaliseBook).filter((b): b is Book => b !== null);
    }
  }
  return (await getAllBooks())
    .filter((book) => book.series === series)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
});

export const getCampaign = cache(async (campaignId: string): Promise<Campaign | null> => {
  if (isSanityConfigured()) {
    const campaign = await sanityFetch<Campaign | null>(campaignByIdQuery, { campaignId });
    if (campaign) {
      return { ...campaign, attributionLinks: campaign.attributionLinks ?? [] };
    }
  }
  return seedCampaignById(campaignId);
});

export const getLandingPage = cache(async (campaignId: string): Promise<LandingPage | null> => {
  if (isSanityConfigured()) {
    const page = await sanityFetch<LandingPage | null>(landingPageByCampaignQuery, { campaignId });
    if (page) return normaliseLandingPage(page);
  }
  return normaliseLandingPage(seedLandingPage(campaignId));
});

/**
 * Resolves everything a conversion page renders. Returns null only when the
 * campaign itself is unknown — a missing book or landing page is surfaced by the
 * publication guard instead, so the page can degrade rather than 404.
 */
export async function getLandingPageBundle(campaignId: string): Promise<LandingPageBundle | null> {
  const [landingPage, campaign] = await Promise.all([
    getLandingPage(campaignId),
    getCampaign(campaignId),
  ]);

  if (!campaign || !landingPage) return null;

  const book = await getBookBySlug(landingPage.bookSlug || campaign.bookSlug);
  if (!book) return null;

  const seriesEntryBook = book.series
    ? ((await getBooksBySeries(book.series)).find((b) => b.seriesOrder === 0) ?? null)
    : null;

  return { landingPage, book, campaign, seriesEntryBook };
}

export async function getHudsonDynastyBooks(): Promise<Book[]> {
  return getBooksBySeries(HUDSON_DYNASTY);
}
