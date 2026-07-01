import { Layout } from '@/components/layout/Layout';

// NOTE: Static page, no i18n, for the same reason as TermsOfServicePage.

export function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-silver-300">
        <div className="text-center space-y-3">
          <h1 className="guild-title-strong font-fantasy text-4xl tracking-widest text-silver-100">
            Privacy Policy
          </h1>
          <p className="text-silver-400 text-sm">
            Last updated: July 1, 2026
          </p>
        </div>

        <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6 flex flex-col gap-6">
          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              1. Who We Are
            </h2>
            <p>
              "Guilds of the Deep" is a student project built as part of the
              École 42 Belgium program, currently hosted in a local
              environment (localhost) for educational purposes.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Elise Van Droogenbroeck — evan-dro@student.42belgium.be</li>
              <li>Jennifer Paulis — jpaulis@student.42belgium.be</li>
              <li>Jérémie Debrulle — jdebrull@student.42belgium.be</li>
              <li>Martin Lafontaine — malafont@student.42belgium.be</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              2. Data We Collect
            </h2>
            <p>
              When you create an account, we only collect:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>your email address;</li>
              <li>your password (stored encrypted/hashed).</li>
            </ul>
            <p className="mt-2">
              No other personal data is collected. The Service does not use
              any tracking cookies, any analytics tools, and does not rely on
              any third-party service (advertising, social media, payment,
              etc.).
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              3. Purpose of Processing
            </h2>
            <p>
              Your email address and password are used exclusively to let
              you create an account and log in to the Service. This
              information is not used for any other purpose: no marketing
              emails, no sale or sharing with third parties, no profiling.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              4. Data Retention
            </h2>
            <p>
              Your data is kept in the database for as long as your account
              exists. It is deleted if you request the deletion of your
              account, or if the project stops being maintained (end of the
              school curriculum).
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              5. Data Sharing
            </h2>
            <p>
              Your data is not shared with any third party. It remains
              accessible only to the project's development team, strictly
              for the purpose of technical maintenance of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              6. Your Rights
            </h2>
            <p>
              In accordance with the General Data Protection Regulation
              (GDPR), you have the right to access, correct, and delete your
              data. To exercise these rights, contact us at
              evan-dro@student.42belgium.be, jpaulis@student.42belgium.be,
              jdebrull@student.42belgium.be, or malafont@student.42belgium.be.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              7. Security
            </h2>
            <p>
              We implement reasonable measures to protect your data (hashed
              passwords, restricted database access). As the Service is a
              student project under development, production-level security
              is not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              8. Changes
            </h2>
            <p>
              This policy may be updated while the project is in
              development. The date at the top of this page reflects the
              latest version in effect.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              9. Contact
            </h2>
            <p>
              For any question about this policy or your data, write to us
              at evan-dro@student.42belgium.be, jpaulis@student.42belgium.be,
              jdebrull@student.42belgium.be, or malafont@student.42belgium.be.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
