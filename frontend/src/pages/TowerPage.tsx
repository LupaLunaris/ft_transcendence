/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* TowerPage.tsx                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useApi } from '@/hooks/useApi';
import { api, type TowerLevel } from '@/services/api.service';
import { Layout } from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';

export function TowerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: levels, loading, error } = useApi<TowerLevel[]>(() => api.tower.getList());
  const { t } = useTranslation();

  const progress = user?.tower_progress ?? 0;

  const handleLevelClick = (order_index: number) => {
    if (order_index > progress + 1) return;
    navigate(`/play/tower/${order_index}`);
  };

return (
  <Layout>
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/assets/icons/tower.svg"
            alt=""
            className="h-14 w-14 object-contain opacity-75"
          />
        </div>

        <h1 className="guild-title-strong text-3xl font-bold font-fantasy tracking-wide">
          {t('tower_page.title')}
        </h1>

        <p className="text-silver-400 text-sm mt-2">
          {progress === 8
            ? t('tower_page.success')
            : t('tower_page.tower_level', { progress })}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center">
          <Spinner size="lg" className="text-gold-400" />
        </div>
      )}

      {error && (
        <p className="text-ruby-400 text-center text-sm">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
            const level = levels?.find((l) => l.order_index === n);
            const completed = n <= progress;
            const unlocked = n <= progress + 1;
            const locked = !unlocked;

            return (
              <button
                key={n}
                onClick={() => handleLevelClick(n)}
                disabled={locked}
                className={[
                  'relative flex flex-col items-center gap-2 p-5 rounded-xl border transition-all',
                  completed
                    ? 'bg-surface-gold border-gold-500/50 text-silver-100 shadow-gold-soft hover:border-gold-300'
                    : unlocked
                      ? 'gold-edge-hover bg-surface-raised border-surface-border text-silver-100 hover:bg-surface-hover'
                      : 'bg-surface border-surface-border text-silver-500 cursor-not-allowed opacity-60',
                ].join(' ')}
              >
                {completed && (
                  <span className="absolute top-2 right-2 text-xs text-emerald-400">✓</span>
                )}

                {locked && (
                  <span className="absolute top-2 right-2 text-xs text-silver-500">🔒</span>
                )}

                <span
                  className={[
                    'text-3xl font-bold font-fantasy',
                    completed
                      ? 'text-gold-300'
                      : unlocked
                        ? 'text-silver-100'
                        : 'text-silver-500',
                  ].join(' ')}
                >
                  {n}
                </span>

                <span className="text-xs text-center leading-snug">
                  {level?.name ?? t('editor_page.level', { n })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-silver-400">
            <span>
              {t('tower_page.progress')}
            </span>
            <span>
              {progress} {t('tower_page.levels')}
              </span>
          </div>

          <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden border border-surface-border">
            <div
              className="h-full bg-gold-500 rounded-full transition-all duration-500"
              style={{ width: `${(progress / 8) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  </Layout>
);
}
