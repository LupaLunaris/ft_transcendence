import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';

const TEAM = [
  { name: 'Elise Van Droogenbroeck', email: 'evan-dro@student.42belgium.be' },
  { name: 'Jennifer Paulis', email: 'jpaulis@student.42belgium.be' },
  { name: 'Jérémie Debrulle', email: 'jdebrull@student.42belgium.be' },
  { name: 'Martin Lafontaine', email: 'malafont@student.42belgium.be' },
];

export function TermsOfServicePage() {
  const { t } = useTranslation('legal');

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12 text-silver-300">
        <h1 className="guild-title-strong font-fantasy text-4xl tracking-widest text-silver-100 text-center">
          {t('terms_of_service.title')}
        </h1>
        <p className="text-silver-400 text-sm text-center mt-3 mb-8">
          {t('terms_of_service.updated')}
        </p>

        <ul className="list-disc list-inside mb-6 space-y-1">
          {TEAM.map((member) => (
            <li key={member.email}>
              {member.name} — {member.email}
            </li>
          ))}
        </ul>

        <p style={{ whiteSpace: 'pre-line' }}>{t('terms_of_service.text')}</p>
      </div>
    </Layout>
  );
}
