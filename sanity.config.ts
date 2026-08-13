'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schema } from './sanity/schemaTypes';
import { sanityConfig } from './lib/config';

/**
 * Studio config, mounted at /studio. The project ID is read from the same env
 * var the site uses, so a misconfigured Studio and a misconfigured site fail
 * together rather than diverging.
 */
export default defineConfig({
  basePath: '/studio',
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  schema,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Reese Astor')
          .items([
            S.documentTypeListItem('book').title('Books'),
            S.documentTypeListItem('landingPage').title('Landing pages'),
            S.documentTypeListItem('campaign').title('Campaigns'),
            S.documentTypeListItem('socialProof').title('Social proof'),
          ]),
    }),
    visionTool({ defaultApiVersion: sanityConfig.apiVersion }),
  ],
});
