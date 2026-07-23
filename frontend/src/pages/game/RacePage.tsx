
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';

export function RacePage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-white/50">
        <p className="text-4xl mb-4">🏁</p>
        <p className="text-lg font-semibold text-white">
          {t('race_page.title')}
        </p>
        <p className="text-sm mt-2">
          {t('race_page.gamemode')}
        </p>
      </div>
    </Layout>
  );
}
