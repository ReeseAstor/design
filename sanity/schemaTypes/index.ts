import type { SchemaTypeDefinition } from 'sanity';
import { bookType } from './book';
import { campaignType } from './campaign';
import { landingPageType } from './landingPage';
import { socialProofType } from './socialProof';

export const schemaTypes: SchemaTypeDefinition[] = [
  bookType,
  campaignType,
  landingPageType,
  socialProofType,
];

export const schema = { types: schemaTypes };
