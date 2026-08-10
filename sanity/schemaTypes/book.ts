import { defineArrayMember, defineField, defineType } from 'sanity';
import { BOOK_FORMATS, PUBLICATION_STATUSES } from '@/lib/content/types';

/**
 * Book.
 *
 * The format array carries import provenance alongside the production asset:
 * `cover_source_url`, `source_width` and `source_height` record where the cover
 * came from, and `cover_asset` is what production actually serves. Keeping both
 * means a cover can be re-imported and audited years later.
 */
export const bookType = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'author', type: 'string', initialValue: 'Reese Astor' }),
    defineField({ name: 'series', type: 'string' }),
    defineField({
      name: 'series_order',
      title: 'Series order',
      type: 'number',
      description: 'Book 0 is the series entry point.',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({ name: 'genre', type: 'string' }),
    defineField({
      name: 'publication_status',
      title: 'Publication status',
      type: 'string',
      options: { list: [...PUBLICATION_STATUSES] },
      initialValue: 'prelaunch',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'short_hook',
      title: 'Short hook',
      type: 'text',
      rows: 3,
      description: 'Two lines. Rendered as the page headline.',
    }),
    defineField({
      name: 'long_blurb',
      title: 'Long blurb',
      type: 'array',
      of: [defineArrayMember({ type: 'text', rows: 4 })],
      description: 'One entry per paragraph. Short single-line beats are set in display type.',
    }),
    defineField({
      name: 'tropes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'trope',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'label', subtitle: 'description' } },
        }),
      ],
    }),
    defineField({
      name: 'content_notes',
      title: 'Content notes',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Written plainly. These appear above the final CTA.',
    }),
    defineField({
      name: 'formats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bookFormat',
          fields: [
            defineField({
              name: 'format',
              type: 'string',
              options: { list: [...BOOK_FORMATS] },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'asin',
              type: 'string',
              description: 'Leave empty until KDP assigns one. Never invent an ASIN.',
              validation: (rule) =>
                rule.custom((value) =>
                  !value || /^[A-Z0-9]{10}$/.test(value)
                    ? true
                    : 'An ASIN is 10 uppercase alphanumeric characters.',
                ),
            }),
            defineField({ name: 'price_usd', title: 'Price (USD)', type: 'number' }),
            defineField({
              name: 'ku_enabled',
              title: 'Kindle Unlimited',
              type: 'boolean',
              initialValue: false,
              description: 'Kindle ebooks only. Ignored for paperback and audiobook.',
              // A hidden field would be lost on format changes; validating keeps
              // the mistake visible to the editor instead.
              validation: (rule) =>
                rule.custom((value, context) => {
                  const parent = context.parent as { format?: string } | undefined;
                  if (value === true && parent?.format && parent.format !== 'ebook') {
                    return 'Kindle Unlimited applies to Kindle ebooks only.';
                  }
                  return true;
                }),
            }),
            defineField({ name: 'amazon_product_url', title: 'Amazon product URL', type: 'url' }),
            defineField({ name: 'amazon_review_url', title: 'Amazon review URL', type: 'url' }),
            defineField({
              name: 'cover_source_url',
              title: 'Cover source URL',
              type: 'url',
              description: 'Import provenance only. Production serves the asset below.',
            }),
            defineField({ name: 'source_width', title: 'Source width', type: 'number' }),
            defineField({ name: 'source_height', title: 'Source height', type: 'number' }),
            defineField({
              name: 'cover_asset',
              title: 'Cover asset',
              type: 'image',
              options: { hotspot: false },
              description: 'The approved production cover. Uploaded by scripts/import-cover-assets.ts.',
            }),
            defineField({ name: 'active', type: 'boolean', initialValue: true }),
          ],
          preview: {
            select: { title: 'format', subtitle: 'asin', media: 'cover_asset' },
          },
        }),
      ],
    }),
    defineField({ name: 'release_status', title: 'Release status', type: 'string' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'series', media: 'formats.0.cover_asset' },
  },
});
