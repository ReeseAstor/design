import type { NextConfig } from 'next';

/**
 * Development-only rendering of Amazon-hosted cover art is permitted by the build
 * brief, but never in production: production pages must render the Sanity-hosted
 * asset that `scripts/import-cover-assets.ts` uploads.
 */
const allowAmazonImageHost =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_AMAZON_IMAGE_HOST === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      ...(allowAmazonImageHost
        ? ([
            {
              protocol: 'https' as const,
              hostname: 'm.media-amazon.com',
              pathname: '/images/I/**',
            },
          ] as const)
        : []),
    ],
  },
  async redirects() {
    return [
      // Migration redirects from the legacy static site.
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/books.html', destination: '/books', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
      { source: '/cookies.html', destination: '/cookies', permanent: true },
      // The book everything points at.
      { source: '/golden-parachute.html', destination: '/golden-parachute', permanent: true },
      { source: '/series/hudson-dynasty', destination: '/hudson-dynasty', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Tracked redirects and campaign pages must never be cached by shared caches:
        // they read first-party cookies and assign experiment variants.
        source: '/go/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
