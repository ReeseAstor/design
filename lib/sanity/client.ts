import 'server-only';
import { createClient, type SanityClient } from 'next-sanity';
import { isSanityConfigured, sanityConfig } from '@/lib/config';

let readClient: SanityClient | null = null;

/** Returns null in seed-content mode so callers fall back without try/catch. */
export function getSanityReadClient(): SanityClient | null {
  if (!isSanityConfigured()) return null;

  readClient ??= createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn: true,
    perspective: 'published',
    token: sanityConfig.readToken || undefined,
  });

  return readClient;
}
