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

export function TowerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: levels, loading, error } = useApi<TowerLevel[]>(() => api.tower.getList());

  const progress = user?.tower_progress ?? 0;

  const handleLevelClick = (order_index: number) => {
    if (order_index > progress + 1) return;
    navigate(`/play/tower/${order_index}`);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
        <div className="text-center">
          <p className="text-4xl mb-3">🗼</p>
          <h1 className="text-3xl font-bold font-fantasy text-white tracking-wide">La Tour</h1>
          <p className="text-white/50 text-sm mt-2">
            {progress === 8
              ? 'Tour complétée ! Tu es le Maître des Profondeurs.'
              : `Niveau actuel : ${progress} / 8`}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center">
            <Spinner size="lg" className="text-deep-400" />
          </div>
        )}

        {error && (
          <p className="text-coral-400 text-center text-sm">{error}</p>
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
                      ? 'bg-deep-700 border-deep-400 text-white hover:bg-deep-600'
                      : unlocked
                        ? 'bg-surface-raised border-surface-border text-white hover:bg-surface-muted hover:border-deep-400'
                        : 'bg-surface border-surface-border text-white/30 cursor-not-allowed',
                  ].join(' ')}
                >
                  {/* Status badge */}
                  {completed && (
                    <span className="absolute top-2 right-2 text-xs text-deep-300">✓</span>
                  )}
                  {locked && (
                    <span className="absolute top-2 right-2 text-xs">🔒</span>
                  )}

                  {/* Level number */}
                  <span className={[
                    'text-3xl font-bold font-fantasy',
                    completed ? 'text-deep-200' : unlocked ? 'text-white' : 'text-white/30',
                  ].join(' ')}>
                    {n}
                  </span>

                  {/* Level name */}
                  <span className="text-xs text-center leading-snug">
                    {level?.name ?? `Niveau ${n}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {!loading && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-white/40">
              <span>Progression</span>
              <span>{progress} / 8 niveaux</span>
            </div>
            <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-deep-400 rounded-full transition-all duration-500"
                style={{ width: `${(progress / 8) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
