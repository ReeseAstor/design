import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

/**
 * Write client for the seed and import scripts. These run from a terminal, not
 * from the app, so they fail loudly on missing credentials rather than falling
 * back to seed mode.
 */
export function createWriteClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId) {
    throw new Error(
      'NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Create .env.local from .env.example first.',
    );
  }
  if (!token) {
    throw new Error(
      'SANITY_API_WRITE_TOKEN is not set. Create an editor token at sanity.io/manage.',
    );
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-10-01',
    token,
    useCdn: false,
  });
}

export function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}
