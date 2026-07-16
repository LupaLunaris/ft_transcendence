/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* TrainingPage.tsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/16 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty } from '@ft/shared';
import { usePublishedMaps } from '@/hooks/useMap';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';

const DIFFICULTIES: { value: Difficulty; key: string }[] = [
  { value: 'easy',   key: 'duel_page.difficulty_easy' },
  { value: 'medium', key: 'duel_page.difficulty_medium' },
  { value: 'hard',   key: 'duel_page.difficulty_hard' },
] as const;

const PAGE_SIZE = 20;

export function TrainingPage() {
  const navigate = useNavigate();
  const [enemyDifficulty, setEnemyDifficulty] = useState<Difficulty>('medium');
  const [page, setPage] = useState(1);
  const { maps, total, loading, error } = usePublishedMaps(page);
  const { t } = useTranslation();

  function handlePlay(mapId: string) {
    navigate(`/play/${mapId}`, {
      state: {
        enemyDifficulty,
      },
    });
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide">
          ⚔️ {t('navbar.train')}
        </h1>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
            Vitesse des ennemis
          </p>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, key }) => (
            <button
              key={key}
              onClick={() => setEnemyDifficulty(value)}
              className={[
                'px-3 py-1 rounded text-sm font-medium border transition-colors',
                enemyDifficulty === value
                  ? 'bg-deep-700 border-deep-400 text-white'
                  : 'bg-transparent border-surface-border text-white/60 hover:text-white',
              ].join(' ')}
            >
              {t(key)}
            </button>
          ))}
        </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-deep-400" />
          </div>
        )}

        {error && (
          <p className="text-coral-400 text-center py-12">{error}</p>
        )}

        {!loading && !error && maps.length === 0 && (
          <p className="text-white/40 text-center py-12">
            {t('duel_page.no_published_map')}
          </p>
        )}

        {!loading && !error && maps.length > 0 && (
          <div className="flex flex-col gap-3">
            {maps.map((map) => (
              <div
                key={map.id}
                className="flex items-center justify-between bg-surface-raised border border-surface-border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{map.name}</p>
                  <p className="text-xs mt-0.5 text-white/50">
                    {t('duel_page.play_count', { count: map.play_count })}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePlay(map.id)}
                >
                  {t('training_page.play')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex justify-center items-center gap-3 mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-white/50 text-sm">
              {t('common.page', { current: page, total: Math.ceil(total / PAGE_SIZE) })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
