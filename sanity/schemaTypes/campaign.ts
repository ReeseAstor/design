import { defineArrayMember, defineField, defineType } from 'sanity';
import { BOOK_FORMATS, TRAFFIC_SOURCES } from '@/lib/content/types';
import { EXPERIMENT_VARIANTS } from '@/lib/experiments/definitions';
import { isAllowedAmazonDestination } from '@/lib/amazon/allowlist';

/**
 * Campaign.
 *
 * The attribution links carry the money. Each one is validated against the same
 * Amazon host allowlist the redirect uses, so a mistyped or pasted-from-anywhere
 * URL is caught in the Studio rather than at click time.
 */
export const campaignType = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  fields: [
    defineField({
      name: 'campaign_id',
      title: 'Campaign ID',
      type: 'string',
      description: 'Must match a campaign in lib/campaigns/registry.ts, e.g. GP_META_FORCEDPROX.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'campaign_id', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'traffic_source',
      title: 'Traffic source',
      type: 'string',
      options: { list: [...TRAFFIC_SOURCES] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'audience', type: 'string' }),
    defineField({ name: 'creative_id', title: 'Creative ID', type: 'string' }),
    defineField({
      name: 'book_reference',
      title: 'Book',
      type: 'reference',
      to: [{ type: 'book' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'landing_page_reference',
      title: 'Landing page',
      type: 'reference',
      to: [{ type: 'landingPage' }],
    }),
    defineField({ name: 'active', type: 'boolean', initialValue: false }),
    defineField({ name: 'starts_at', title: 'Starts at', type: 'datetime' }),
    defineField({ name: 'ends_at', title: 'Ends at', type: 'datetime' }),
    defineField({
      name: 'attribution_links',
      title: 'Amazon Attribution links',
      type: 'array',
      description:
        'A paid campaign will not publish its purchase CTA until it has a link for the format and variant being served.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'attributionLink',
          fields: [
            defineField({
              name: 'marketplace',
              type: 'string',
              initialValue: 'https://www.amazon.com',
            }),
            defineField({
              name: 'experiment_key',
              title: 'Experiment key',
              type: 'string',
              description: 'Leave empty to apply to any experiment.',
            }),
            defineField({
              name: 'variant',
              type: 'string',
              options: { list: [...EXPERIMENT_VARIANTS] },
              initialValue: 'control',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'format',
              type: 'string',
              options: { list: [...BOOK_FORMATS] },
              initialValue: 'ebook',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'amazon_attribution_url',
              title: 'Amazon Attribution URL',
              type: 'url',
              validation: (rule) =>
                rule.required().custom((value) =>
                  isAllowedAmazonDestination(typeof value === 'string' ? value : null)
                    ? true
                    : 'Must be an https Amazon URL (amazon.<tld> or amzn.to).',
                ),
            }),
          ],
          preview: {
            select: { title: 'variant', subtitle: 'amazon_attribution_url' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'campaign_id', subtitle: 'traffic_source' },
  },
});
