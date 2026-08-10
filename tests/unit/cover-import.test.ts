import { describe, expect, it } from 'vitest';
import catalog from '@/data/catalog.seed.json';
import {
  collectImportTargets,
  readImageDimensions,
  validateDimensions,
} from '@/scripts/import-cover-assets';

/**
 * The import pipeline's decision logic, exercised without the network. The
 * remaining unverified step is the HTTP fetch itself, which needs egress to
 * m.media-amazon.com.
 */

function pngWithDimensions(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function jpegWithDimensions(width: number, height: number): Buffer {
  // SOI, then a JFIF APP0 segment, then an SOF0 frame header.
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)]);
  const sof0 = Buffer.alloc(11);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0.writeUInt16BE(0x0011, 2); // segment length
  sof0[4] = 8; // precision
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof0]);
}

describe('cover import targets', () => {
  const targets = collectImportTargets(catalog.books as never);

  it('collects exactly the 24 supplied live cover records', () => {
    expect(targets).toHaveLength(24);
    expect(new Set(targets.map((target) => target.bookSlug)).size).toBe(8);
  });

  it('skips Golden Parachute, which has no supplied cover', () => {
    expect(targets.some((target) => target.bookSlug === 'golden-parachute')).toBe(false);
  });

  it('carries the source URL and expected dimensions for every target', () => {
    for (const target of targets) {
      expect(target.sourceUrl).toMatch(/^https:\/\/m\.media-amazon\.com\/images\/I\//);
      expect(target.expectedWidth).toBeGreaterThan(0);
      expect(target.expectedHeight).toBeGreaterThan(0);
    }
  });

  it('covers all three formats for each live title', () => {
    const byBook = new Map<string, string[]>();
    for (const target of targets) {
      byBook.set(target.bookSlug, [...(byBook.get(target.bookSlug) ?? []), target.format]);
    }
    for (const [slug, formats] of byBook) {
      expect(formats.sort(), slug).toEqual(['audiobook', 'ebook', 'paperback']);
    }
  });
});

describe('image header parsing', () => {
  it('reads PNG dimensions from IHDR', () => {
    expect(readImageDimensions(pngWithDimensions(1000, 1499))).toEqual({
      width: 1000,
      height: 1499,
      mime: 'image/png',
    });
  });

  it('reads JPEG dimensions from the SOF0 frame header', () => {
    expect(readImageDimensions(jpegWithDimensions(972, 1500))).toEqual({
      width: 972,
      height: 1500,
      mime: 'image/jpeg',
    });
  });

  it('returns null for anything that is not an image', () => {
    expect(readImageDimensions(Buffer.from('<!doctype html><html></html>'))).toBeNull();
    expect(readImageDimensions(Buffer.alloc(4))).toBeNull();
  });
});

describe('dimension validation', () => {
  it('accepts dimensions matching the seed record', () => {
    expect(validateDimensions({ width: 972, height: 1500 }, { width: 972, height: 1500 })).toEqual({
      ok: true,
    });
  });

  it('tolerates a small drift', () => {
    expect(validateDimensions({ width: 980, height: 1500 }, { width: 972, height: 1500 }).ok).toBe(
      true,
    );
  });

  it('rejects art that is a different size from the record', () => {
    const result = validateDimensions({ width: 600, height: 900 }, { width: 972, height: 1500 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('width');
  });

  it('rejects a thumbnail regardless of the expected size', () => {
    const result = validateDimensions({ width: 120, height: 180 }, { width: null, height: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('minimum');
  });
});
