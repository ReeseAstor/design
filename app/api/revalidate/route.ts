import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { sanityConfig } from '@/lib/config';

/**
 * POST /api/revalidate
 *
 * Sanity webhook target. Requires the shared secret in `x-revalidate-secret`,
 * compared in constant time so the endpoint cannot be probed a byte at a time.
 * With no secret configured the route refuses to run at all rather than
 * defaulting open.
 */

export const dynamic = 'force-dynamic';

function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

const REVALIDATED_PATHS = [
  '/',
  '/books',
  '/golden-parachute',
  '/hudson-dynasty',
  '/gp/meta-forced-proximity',
  '/gp/tiktok-kai',
  '/gp/bookbub-billionaire',
  '/gp/newsletter',
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expected = sanityConfig.revalidateSecret;

  if (!expected) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET is not configured — refusing.');
    return NextResponse.json({ ok: false, message: 'Not configured.' }, { status: 503 });
  }

  const provided =
    request.headers.get('x-revalidate-secret') ??
    request.nextUrl.searchParams.get('secret') ??
    '';

  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  // `max` expires the tag as aggressively as the cache allows: a webhook fires
  // because an editor published a change and expects to see it.
  revalidateTag('content', 'max');
  for (const path of REVALIDATED_PATHS) {
    revalidatePath(path);
  }

  const body = (await request.json().catch(() => null)) as { slug?: { current?: string } } | null;
  const slug = body?.slug?.current;
  if (slug && /^[a-z0-9-]+$/.test(slug)) {
    revalidatePath(`/books/${slug}`);
  }

  return NextResponse.json({ ok: true, revalidated: REVALIDATED_PATHS.length, at: Date.now() });
}
