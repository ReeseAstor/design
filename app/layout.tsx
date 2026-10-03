import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { siteUrl } from '@/lib/config';
import { JsonLd, personJsonLd } from '@/lib/seo/structured-data';
import './globals.css';

const display = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Reese Astor — Contemporary Billionaire Romance',
    template: '%s | Reese Astor',
  },
  description:
    'USA Today bestselling author Reese Astor writes contemporary billionaire romance: the Hudson Dynasty and Manhattan Money Kings series.',
  openGraph: {
    type: 'website',
    siteName: 'Reese Astor',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-none focus:bg-ink focus:px-4 focus:py-3 focus:text-canvas focus:no-underline"
        >
          Skip to content
        </a>
        <JsonLd data={personJsonLd()} />
        <PostHogProvider>{children}</PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
