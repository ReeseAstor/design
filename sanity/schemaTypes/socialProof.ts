import { defineField, defineType } from 'sanity';

/**
 * Social proof.
 *
 * Nothing here renders unless `approved` is true. A rating renders only when it
 * is paired with the scale it was measured on, and a review count only alongside
 * a rating — a bare number is not evidence.
 */
export const socialProofType = defineType({
  name: 'socialProof',
  title: 'Social proof',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(320),
    }),
    defineField({ name: 'display_name', title: 'Display name', type: 'string' }),
    defineField({
      name: 'source_name',
      title: 'Source',
      type: 'string',
      description: 'Where it was published, e.g. "Amazon verified review".',
    }),
    defineField({
      name: 'source_url',
      title: 'Source URL',
      type: 'url',
      description: 'Linked only when it points at an allowlisted Amazon host.',
    }),
    defineField({
      name: 'approved',
      type: 'boolean',
      initialValue: false,
      description: 'Nothing renders on the site until this is on.',
    }),
    defineField({ name: 'approved_at', title: 'Approved at', type: 'datetime' }),
    defineField({
      name: 'rating',
      type: 'number',
      description: 'Optional. Requires a rating scale to render.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'rating_scale',
      title: 'Rating scale',
      type: 'number',
      description: 'The maximum of the scale, e.g. 5.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { rating?: number } | undefined;
          if (parent?.rating !== undefined && parent.rating !== null && !value) {
            return 'A rating cannot be shown without the scale it was measured on.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'review_count',
      title: 'Review count',
      type: 'number',
      description: 'Only enter a figure you have verified today.',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'last_verified_at',
      title: 'Last verified at',
      type: 'datetime',
      description: 'Ratings and counts drift. Re-check before a launch push.',
    }),
  ],
  preview: {
    select: { title: 'quote', subtitle: 'source_name', approved: 'approved' },
    prepare({ title, subtitle, approved }) {
      return {
        title: title ?? 'Untitled quote',
        subtitle: `${approved ? '✓ approved' : '• not approved'}${subtitle ? ` · ${subtitle}` : ''}`,
      };
    },
  },
});
