import { Layout } from '@/components/layout/Layout';

// NOTE: This is a simple static page (no i18n) since ToS/Privacy text
// should stay legally stable and not depend on translation quality.

export function TermsOfServicePage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-silver-300">
        <div className="text-center space-y-3">
          <h1 className="guild-title-strong font-fantasy text-4xl tracking-widest text-silver-100">
            Terms of Service
          </h1>
          <p className="text-silver-400 text-sm">
            Last updated: July 1, 2026
          </p>
        </div>

        <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6 flex flex-col gap-6">
          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              1. Overview
            </h2>
            <p>
              "Guilds of the Deep" (the "Service") is a student project
              developed as part of the École 42 Belgium program. The Service
              is currently in development and hosted in a local environment
              (localhost) for educational, non-commercial purposes.
            </p>
            <p className="mt-2">
              Project team:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Elise Van Droogenbroeck — evan-dro@student.42belgium.be</li>
              <li>Jennifer Paulis — jpaulis@student.42belgium.be</li>
              <li>Jérémie Debrulle — jdebrull@student.42belgium.be</li>
              <li>Martin Lafontaine — malafont@student.42belgium.be</li>
            </ul>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              2. Acceptance of Terms
            </h2>
            <p>
              By creating an account on the Service, you agree to these Terms
              of Service and the accompanying Privacy Policy. If you do not
              agree to these terms, you should not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              3. User Account
            </h2>
            <p>
              Creating an account requires a valid email address and a
              password. You are responsible for keeping your credentials
              confidential and for any activity carried out from your
              account.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              4. Nature of the Project
            </h2>
            <p>
              The Service is a student project provided "as is", with no
              guarantee of availability, continuity, or absence of bugs. It
              may be interrupted, reset, or deleted at any time without
              notice, in particular at the end of the school curriculum.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              5. User Conduct
            </h2>
            <p>
              You agree to use the Service reasonably and to not attempt to
              compromise its operation (unauthorized access, exploitation of
              vulnerabilities, etc.).
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              6. Account Deletion
            </h2>
            <p>
              You may request the deletion of your account and your data at
              any time by contacting any of the addresses listed in section
              1.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              7. Changes
            </h2>
            <p>
              These terms may be updated at any time while the project is in
              development. The date at the top of this page reflects the
              latest version in effect.
            </p>
          </section>

          <section>
            <h2 className="font-fantasy text-xl text-gold-300 mb-2">
              8. Contact
            </h2>
            <p>
              For any question about these terms, you can reach us at
              evan-dro@student.42belgium.be, jpaulis@student.42belgium.be,
              jdebrull@student.42belgium.be, or malafont@student.42belgium.be.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
