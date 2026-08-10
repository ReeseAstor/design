/**
 * Imports cover art from the supplied SL1500 source URLs into Sanity.
 *
 *   npm run import:covers -- --dry-run   # fetch and validate, upload nothing
 *   npm run import:covers                # fetch, validate, upload, patch
 *
 * The Amazon URLs in the seed are *import sources*, not production dependencies.
 * After this runs, production serves the Sanity-hosted asset through next/image
 * and the original URL survives only as provenance on the format record.
 *
 * Golden Parachute has no cover source and is skipped by design. Substituting
 * another title's art would misrepresent the product, and the publication guard
 * depends on the absence being real.
 */

import catalog from '../data/catalog.seed.json';
import { bookDocId } from './seed-catalog';
import { createWriteClient, isDryRun } from './sanity-write-client';

interface SeedFormat {
  format: string;
  asin: string | null;
  coverSourceUrl: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
}

interface SeedBook {
  title: string;
  slug: string;
  publicationStatus: string;
  formats: SeedFormat[];
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIN_DIMENSION = 300;
const DIMENSION_TOLERANCE = 0.02;

export interface ImportTarget {
  bookSlug: string;
  bookTitle: string;
  format: string;
  sourceUrl: string;
  expectedWidth: number | null;
  expectedHeight: number | null;
}

export interface ImportOutcome {
  target: ImportTarget;
  ok: boolean;
  reason?: string;
  assetId?: string;
  width?: number;
  height?: number;
}

/** Every live format that carries a cover source URL. */
export function collectImportTargets(books: SeedBook[]): ImportTarget[] {
  const targets: ImportTarget[] = [];

  for (const book of books) {
    for (const format of book.formats) {
      if (!format.coverSourceUrl) continue;
      targets.push({
        bookSlug: book.slug,
        bookTitle: book.title,
        format: format.format,
        sourceUrl: format.coverSourceUrl,
        expectedWidth: format.sourceWidth,
        expectedHeight: format.sourceHeight,
      });
    }
  }

  return targets;
}

/** Reads intrinsic dimensions from the file header, without an image library. */
export function readImageDimensions(
  buffer: Buffer,
): { width: number; height: number; mime: string } | null {
  // PNG: IHDR is always the first chunk.
  if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      mime: 'image/png',
    };
  }

  // JPEG: walk the segment markers to the SOF frame header.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1]!;
      // SOF0-SOF15, excluding the DHT/JPG/DAC markers that share the range.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
          mime: 'image/jpeg',
        };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }

  // WebP: VP8X carries the canvas size for the extended format.
  if (
    buffer.length > 30 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP' &&
    buffer.subarray(12, 16).toString('ascii') === 'VP8X'
  ) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
      mime: 'image/webp',
    };
  }

  return null;
}

export function validateDimensions(
  actual: { width: number; height: number },
  expected: { width: number | null; height: number | null },
): { ok: true } | { ok: false; reason: string } {
  if (actual.width < MIN_DIMENSION || actual.height < MIN_DIMENSION) {
    return {
      ok: false,
      reason: `image is ${actual.width}x${actual.height}, below the ${MIN_DIMENSION}px minimum`,
    };
  }

  // The seed records the dimensions Amazon served at import time. A small drift
  // is normal; a large one means the URL now points at different art.
  for (const [axis, actualValue, expectedValue] of [
    ['width', actual.width, expected.width],
    ['height', actual.height, expected.height],
  ] as const) {
    if (expectedValue === null) continue;
    const drift = Math.abs(actualValue - expectedValue) / expectedValue;
    if (drift > DIMENSION_TOLERANCE) {
      return {
        ok: false,
        reason: `${axis} is ${actualValue}, expected about ${expectedValue} (${Math.round(drift * 100)}% drift)`,
      };
    }
  }

  return { ok: true };
}

async function fetchCover(target: ImportTarget): Promise<
  | { ok: true; buffer: Buffer; width: number; height: number; mime: string }
  | { ok: false; reason: string }
> {
  let response: Response;
  try {
    response = await fetch(target.sourceUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*',
        // Amazon's image CDN rejects some default runtime user agents.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
      redirect: 'follow',
    });
  } catch (error) {
    return { ok: false, reason: `request failed: ${String(error)}` };
  }

  if (!response.ok) {
    return { ok: false, reason: `HTTP ${response.status}` };
  }

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
  if (!ALLOWED_MIME.has(contentType)) {
    return { ok: false, reason: `unexpected content type "${contentType}"` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const dimensions = readImageDimensions(buffer);
  if (!dimensions) {
    return { ok: false, reason: 'could not read image dimensions from the file header' };
  }

  const validation = validateDimensions(dimensions, {
    width: target.expectedWidth,
    height: target.expectedHeight,
  });
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  return { ok: true, buffer, ...dimensions };
}

async function main() {
  const dryRun = isDryRun();
  const books = catalog.books as unknown as SeedBook[];
  const targets = collectImportTargets(books);

  console.log(`Found ${targets.length} cover records with a source URL.`);

  const skipped = books.filter((book) => book.formats.every((f) => !f.coverSourceUrl));
  for (const book of skipped) {
    console.log(`Skipping "${book.title}" — no cover source supplied (${book.publicationStatus}).`);
  }

  const client = dryRun ? null : createWriteClient();
  const outcomes: ImportOutcome[] = [];

  for (const target of targets) {
    const label = `${target.bookSlug} (${target.format})`;
    const fetched = await fetchCover(target);

    if (!fetched.ok) {
      console.error(`  ✗ ${label}: ${fetched.reason}`);
      outcomes.push({ target, ok: false, reason: fetched.reason });
      continue;
    }

    if (dryRun || !client) {
      console.log(`  ✓ ${label}: ${fetched.width}x${fetched.height} ${fetched.mime} (dry run)`);
      outcomes.push({ target, ok: true, width: fetched.width, height: fetched.height });
      continue;
    }

    const asset = await client.assets.upload('image', fetched.buffer, {
      filename: `${target.bookSlug}-${target.format}.jpg`,
      contentType: fetched.mime,
      // Provenance travels with the asset, not only with the document.
      description: `${target.bookTitle} — ${target.format} cover. Imported from ${target.sourceUrl}`,
    });

    // Patch the matching format entry in place, leaving the other formats alone.
    const doc = await client.getDocument(bookDocId(target.bookSlug));
    const formats = (doc?.formats ?? []) as Array<{ _key: string; format: string }>;
    const entry = formats.find((f) => f.format === target.format);

    if (!entry) {
      const reason = `no "${target.format}" format on ${bookDocId(target.bookSlug)} — run npm run seed:catalog first`;
      console.error(`  ✗ ${label}: ${reason}`);
      outcomes.push({ target, ok: false, reason });
      continue;
    }

    await client
      .patch(bookDocId(target.bookSlug))
      .set({
        [`formats[_key=="${entry._key}"].cover_asset`]: {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
        },
        [`formats[_key=="${entry._key}"].cover_source_url`]: target.sourceUrl,
        [`formats[_key=="${entry._key}"].source_width`]: fetched.width,
        [`formats[_key=="${entry._key}"].source_height`]: fetched.height,
      })
      .commit();

    console.log(`  ✓ ${label}: uploaded ${asset._id} (${fetched.width}x${fetched.height})`);
    outcomes.push({
      target,
      ok: true,
      assetId: asset._id,
      width: fetched.width,
      height: fetched.height,
    });
  }

  const succeeded = outcomes.filter((o) => o.ok).length;
  const failed = outcomes.length - succeeded;

  console.log(`\n${succeeded}/${outcomes.length} covers imported. ${failed} failed.`);

  if (failed > 0) process.exitCode = 1;
}

if (process.argv[1] && process.argv[1].includes('import-cover-assets')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
