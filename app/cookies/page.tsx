import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';
import {
  AMAZON_CLICK_MAX_AGE_SECONDS,
  COOKIE_AMAZON_CLICK,
  COOKIE_ANON_ID,
  COOKIE_RETURNING_READER,
} from '@/lib/cookies';

export const metadata: Metadata = {
  title: 'Cookies & Analytics | Reese Astor',
  description:
    'Every cookie this site sets, what it holds, how long it lasts, and how to turn analytics off.',
  alternates: { canonical: '/cookies' },
};

const DAYS = Math.round(AMAZON_CLICK_MAX_AGE_SECONDS / 86400);

const COOKIES = [
  {
    name: COOKIE_ANON_ID,
    purpose:
      'A random ID for this browser. It decides which version of a headline test you see and keeps that choice consistent between visits.',
    contains: 'A random UUID. No name, no email, nothing derived from you.',
    life: '400 days',
  },
  {
    name: COOKIE_AMAZON_CLICK,
    purpose:
      'Records that this browser clicked through to Amazon for a particular book, so the page can offer the bonus scene instead of repeating the same pitch.',
    contains: 'A book slug and a timestamp. It is not readable by scripts.',
    life: `${DAYS} days`,
  },
  {
    name: COOKIE_RETURNING_READER,
    purpose:
      'A readable flag mirroring the cookie above, so the page can adjust what it shows without a round trip to the server.',
    contains: 'The single character "1".',
    life: `${DAYS} days`,
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies and analytics"
      updated="August 2026"
      intro="Three first-party cookies. No advertising cookies, no third-party trackers, no consent wall standing between you and the page."
    >
      <LegalSection heading="The cookies">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[0.92rem]">
            <caption className="sr-only">Cookies set by reeseastor.com</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-3 pr-4 font-semibold text-gold-bright">
                  Name
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold text-gold-bright">
                  Why it exists
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold text-gold-bright">
                  What it holds
                </th>
                <th scope="col" className="py-3 font-semibold text-gold-bright">
                  Lifetime
                </th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((cookie) => (
                <tr key={cookie.name} className="border-b border-line/60 align-top">
                  <th scope="row" className="py-4 pr-4 font-mono text-[0.85rem] font-normal text-ivory">
                    {cookie.name}
                  </th>
                  <td className="py-4 pr-4 text-ivory/85">{cookie.purpose}</td>
                  <td className="py-4 pr-4 text-ivory/85">{cookie.contains}</td>
                  <td className="py-4 text-ivory/85">{cookie.life}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection heading="Analytics">
        <p>
          PostHog counts seven named events and nothing else. Automatic capture of clicks and page
          views is switched off, and session recording is disabled. The events never contain your
          email address, your name, form contents, anything identifying you on Amazon, whether you
          bought a book, or anything health related.
        </p>
      </LegalSection>

      <LegalSection heading="Turning it off">
        <p>
          Any content blocker will stop analytics loading, and the site is designed to work fully
          without it — the Buy button, the newsletter form and every page work the same. Clearing
          cookies for this site removes all three cookies above; you may then be shown a different
          version of a headline test, which changes nothing about what you can buy or read.
        </p>
      </LegalSection>

      <LegalSection heading="Amazon links">
        <p>
          Purchase buttons pass through this site before going to Amazon, so we can count how many
          readers a campaign sent. Paid campaigns use Amazon Attribution links, which let Amazon
          report sales back to us in aggregate. Amazon does not tell us who you are or what you
          bought.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
