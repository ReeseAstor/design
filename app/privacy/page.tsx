import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Notice | Reese Astor',
  description:
    'What Reese Astor collects, why, and how to have it removed — including newsletter consent, analytics, and Amazon links.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = 'August 2026';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated={UPDATED}
      intro="This site sells books. It does not sell readers. Everything it collects is listed below, in the order it is collected."
    >
      <LegalSection heading="Adult content">
        <p>
          Reese Astor writes adult contemporary romance. The books and the pages describing them
          contain explicit consensual intimacy and are intended for readers 18 and older. Individual
          book pages also carry content notes covering serious medical crisis, pneumonia and sepsis
          themes, compulsive sexual behaviour and recovery, caregiving stress, and family and
          financial pressure. Those themes are written seriously, not as decoration, and the notes
          are there so you can choose a book deliberately.
        </p>
      </LegalSection>

      <LegalSection heading="What the reader list collects">
        <p>
          If you ask for the bonus scene, we collect your email address, optionally your first name,
          and the campaign, page and offer you came from. That data is stored with Kit, our email
          provider, and is used to send the bonus scene and occasional emails about new releases.
        </p>
        <p>
          We add you only when you tick the consent box. There is no pre-ticked box, no
          "by continuing you agree", and no list you are added to for buying something. Every email
          carries an unsubscribe link, and unsubscribing removes you immediately.
        </p>
      </LegalSection>

      <LegalSection heading="What analytics collects">
        <p>
          We use PostHog to count a small, fixed set of events: a landing page view, a click through
          to Amazon, a click on the Book 0 offer, a view of the newsletter offer, a completed
          signup, a click on a review link, and which version of a headline test you saw.
        </p>
        <p>
          Those events carry the campaign, the book, the traffic source, the placement of the button
          you clicked, and whether you were on a phone, tablet or desktop.{' '}
          <strong className="text-ivory">
            They never carry your email address, your name, the contents of a form, or anything
            about your health.
          </strong>{' '}
          Session recording is switched off, and there is no automatic capture of clicks or
          keystrokes.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not know">
        <p>
          When you click through to Amazon we record that a click happened. We do not receive your
          Amazon account details, and we are not told whether you bought anything. Nothing on this
          site will ever thank you for a purchase on the strength of a click, because a click is not
          a purchase.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          Three first-party cookies, all described on the{' '}
          <Link href="/cookies" className="text-gold underline underline-offset-2">
            cookies and analytics page
          </Link>
          . None of them contains personal data.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          To see, correct or delete anything held about you, email{' '}
          <a href="mailto:hello@reeseastor.com" className="text-gold underline underline-offset-2">
            hello@reeseastor.com
          </a>{' '}
          and say what you would like done. We will action it and confirm.
        </p>
        <p>
          Analytics honours your browser's Global Privacy Control and Do Not Track signals. You can
          also block analytics entirely with any content blocker; the site works normally without
          it.
        </p>
      </LegalSection>

      <LegalSection heading="Copyright and trademarks">
        <p>
          All book text, cover art and site copy © Reese Astor. All rights reserved. Amazon, Kindle,
          Kindle Unlimited and Audible are trademarks of Amazon.com, Inc. or its affiliates. This
          site is not endorsed by or affiliated with Amazon.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
