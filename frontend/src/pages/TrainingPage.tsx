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

const DIFFICULTIES: { value: Difficulty | undefined; label: string }[] = [
  { value: undefined, label: 'Toutes' },
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'text-deep-300',
  medium: 'text-yellow-400',
  hard: 'text-coral-400',
};

const PAGE_SIZE = 20;

export function TrainingPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [page, setPage] = useState(1);
  const { maps, total, loading, error } = usePublishedMaps(page, difficulty);

  function handleDifficulty(value: Difficulty | undefined) {
    setDifficulty(value);
    setPage(1);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide">
          ⚔️ S'entraîner
        </h1>

        {/* Difficulty filter */}
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => handleDifficulty(value)}
              className={[
                'px-3 py-1 rounded text-sm font-medium border transition-colors',
                difficulty === value
                  ? 'bg-deep-700 border-deep-400 text-white'
                  : 'bg-transparent border-surface-border text-white/60 hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
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
            Aucune map publiée pour l'instant.
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
                  <p className={`text-xs mt-0.5 ${DIFFICULTY_COLOR[map.difficulty]}`}>
                    {DIFFICULTY_LABEL[map.difficulty]}
                    {' · '}
                    {map.play_count} partie{map.play_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/play/${map.id}`)}
                >
                  Jouer
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
              Précédent
            </Button>
            <span className="text-white/50 text-sm">
              Page {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
