
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 p-4">
      <p className="font-fantasy text-8xl text-deep-700">404</p>
      <h1 className="text-2xl font-semibold text-white">
        {t('not_found_page.not_found_title')}
      </h1>
      <p className="text-white/50 text-sm">
        {t('not_found_page.not_found_subtitle')}
      </p>
      <Link to="/"><Button variant="secondary">
        {t('not_found_page.back_homepage')}
      </Button></Link>
    </div>
  );
}
