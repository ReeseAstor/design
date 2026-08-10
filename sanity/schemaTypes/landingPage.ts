import { defineArrayMember, defineField, defineType } from 'sanity';
import { BOOK_FORMATS } from '@/lib/content/types';
import { EXPERIMENT_KEY } from '@/lib/experiments/definitions';

/**
 * Landing page.
 *
 * One document per campaign. The section order is fixed in code, so what an
 * editor controls here is the copy inside those sections — not the sequence,
 * which is what keeps two campaigns comparable.
 */
export const landingPageType = defineType({
  name: 'landingPage',
  title: 'Landing page',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'slug',
      options: { maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'book_reference',
      title: 'Book',
      type: 'reference',
      to: [{ type: 'book' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'campaign_reference',
      title: 'Campaign',
      type: 'reference',
      to: [{ type: 'campaign' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headline',
      type: 'text',
      rows: 3,
      description: 'Two lines, separated by a line break. This is the H1.',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'subheadline', type: 'text', rows: 3 }),
    defineField({ name: 'positioning_line', title: 'Positioning line', type: 'text', rows: 3 }),
    defineField({ name: 'romance_promise', title: 'Romance promise', type: 'text', rows: 2 }),
    defineField({
      name: 'cta_label',
      title: 'CTA label',
      type: 'string',
      description: 'The control-arm label. The experiment variant overrides it at render time.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ku_support_line',
      title: 'Kindle Unlimited support line',
      type: 'string',
      initialValue: 'Also available with Kindle Unlimited',
    }),
    defineField({
      name: 'trope_order',
      title: 'Trope order',
      type: 'array',
      description: 'The first three labels also form the above-the-fold teaser.',
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
      name: 'social_proof',
      title: 'Social proof',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'socialProof' }] })],
    }),
    defineField({
      name: 'secondary_offer',
      title: 'Series entry offer',
      type: 'object',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'headline', type: 'string' }),
        defineField({ name: 'body', type: 'text', rows: 3 }),
        defineField({ name: 'cta_label', title: 'CTA label', type: 'string' }),
        defineField({
          name: 'book_reference',
          title: 'Book',
          type: 'reference',
          to: [{ type: 'book' }],
        }),
        defineField({
          name: 'format',
          type: 'string',
          options: { list: [...BOOK_FORMATS] },
          initialValue: 'ebook',
        }),
      ],
    }),
    defineField({
      name: 'newsletter_offer',
      title: 'Newsletter offer',
      type: 'object',
      fields: [
        defineField({ name: 'offer_id', title: 'Offer ID', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'cta_label', title: 'CTA label', type: 'string' }),
        defineField({ name: 'promise', type: 'text', rows: 3 }),
        defineField({ name: 'recovery_headline', title: 'Recovery headline', type: 'string' }),
        defineField({ name: 'recovery_body', title: 'Recovery body', type: 'text', rows: 3 }),
        defineField({ name: 'recovery_cta_label', title: 'Recovery CTA label', type: 'string' }),
        defineField({ name: 'returning_headline', title: 'Returning headline', type: 'string' }),
        defineField({ name: 'returning_body', title: 'Returning body', type: 'text', rows: 3 }),
      ],
    }),
    defineField({
      name: 'experiment_key',
      title: 'Experiment key',
      type: 'string',
      initialValue: EXPERIMENT_KEY,
      description: 'Only one experiment runs at a time.',
    }),
    defineField({
      name: 'seo_indexable',
      title: 'Indexable',
      type: 'boolean',
      initialValue: false,
      description: 'Only the organic page is indexable. Paid pages are noindex, follow.',
    }),
    defineField({
      name: 'canonical_url',
      title: 'Canonical URL',
      type: 'url',
      initialValue: 'https://reeseastor.com/golden-parachute',
    }),
    defineField({ name: 'seo_title', title: 'SEO title', type: 'string' }),
    defineField({ name: 'seo_description', title: 'SEO description', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'slug.current', subtitle: 'headline' },
  },
});
