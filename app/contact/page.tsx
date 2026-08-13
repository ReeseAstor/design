import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Contact | Reese Astor',
  description:
    'How to reach Reese Astor about rights, review copies, reader questions, or privacy requests.',
  alternates: { canonical: '/contact' },
};

const EMAIL = 'hello@reeseastor.com';

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      updated="August 2026"
      intro="One inbox, read by a person. Please put the topic in the subject line — it is the quickest route to an answer."
    >
      <LegalSection heading="Email">
        <p>
          <a
            href={`mailto:${EMAIL}`}
            className="tap-target inline-flex items-center text-lg text-gold underline underline-offset-4 hover:text-gold-bright"
          >
            {EMAIL}
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="What to write about">
        <ul className="list-none space-y-3">
          <li>
            <strong className="text-ivory">Reader questions</strong> — reading order, content notes,
            or whether a particular book is right for you.
          </li>
          <li>
            <strong className="text-ivory">Review copies and ARCs</strong> — include where you
            review and roughly how many romance titles you cover a month.
          </li>
          <li>
            <strong className="text-ivory">Rights, translation and audio</strong> — please include
            territory and format.
          </li>
          <li>
            <strong className="text-ivory">Privacy requests</strong> — say what you would like seen,
            corrected or deleted, and it will be actioned and confirmed. See the{' '}
            <Link href="/privacy" className="text-gold underline underline-offset-2">
              privacy notice
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="A note on the subject matter">
        <p>
          These books deal with medical crisis, compulsive sexual behaviour and recovery. They are
          fiction, and nothing in them is medical advice or a treatment plan. If you are struggling
          with any of it, please talk to a clinician rather than to a novelist. In the United States,
          the 988 Suicide &amp; Crisis Lifeline is reachable by call or text at 988.
        </p>
      </LegalSection>

      <LegalSection heading="Publishing">
        <p>Reese Astor titles are published by 88Away LLC.</p>
      </LegalSection>
    </LegalPage>
  );
}
