/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* DuelPage.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/27 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/27 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, DuelStartPayload } from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { usePublishedMaps } from '@/hooks/useMap';
import { useDuelLobby } from '@/hooks/useDuelLobby';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const DIFFICULTIES: { value: Difficulty | undefined; label: string }[] = [
  { value: undefined, label: 'Toutes' },
  { value: 'easy',   label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard',   label: 'Difficile' },
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy:   'Facile',
  medium: 'Moyen',
  hard:   'Difficile',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy:   'text-deep-300',
  medium: 'text-yellow-400',
  hard:   'text-coral-400',
};

const PAGE_SIZE = 20;

export function DuelPage() {
  const navigate    = useNavigate();
  const { user, token } = useAuth();

  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [page,       setPage]       = useState(1);
  const [error,      setError]      = useState<string | null>(null);

  const { maps, total, loading, error: mapsError } = usePublishedMaps(page, difficulty);

  const handleDuelStart = useCallback((payload: DuelStartPayload) => {
    navigate('/duel/game', { state: payload });
  }, [navigate]);

  const { lobbyEntries, myRegistrations, joinLobby, connected } = useDuelLobby({
    token,
    userId: user?.id ?? null,
    onDuelStart: handleDuelStart,
    onError: (msg) => setError(msg),
  });

  function handleDifficulty(value: Difficulty | undefined) {
    setDifficulty(value);
    setPage(1);
  }

  const maxReached = myRegistrations.size >= 3;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide">
            ⚔️ Duel
          </h1>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-white/20'}`} />
            {connected ? 'En ligne' : 'Connexion...'}
          </div>
        </div>

        {error && (
          <p className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/30 rounded px-3 py-2">
            {error}
          </p>
        )}

        {maxReached && (
          <p className="text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-2">
            Inscrit sur 3 maps — retire-toi d'une map pour t'inscrire ailleurs.
          </p>
        )}

        {/* Filtre difficulté */}
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

        {/* Contenu */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-deep-400" />
          </div>
        )}

        {mapsError && (
          <p className="text-coral-400 text-center py-12">{mapsError}</p>
        )}

        {!loading && !mapsError && maps.length === 0 && (
          <p className="text-white/40 text-center py-12">
            Aucune map publiée pour l'instant.
          </p>
        )}

        {!loading && !mapsError && maps.length > 0 && (
          <div className="flex flex-col gap-3">
            {maps.map((map) => {
              const isRegistered = myRegistrations.has(map.id);
              const opponentEntry = lobbyEntries.find(
                e => e.map_id === map.id && e.player.id !== user?.id,
              );
              const hasOpponent = !!opponentEntry;

              return (
                <div
                  key={map.id}
                  className="flex items-center justify-between bg-surface-raised border border-surface-border rounded-lg px-4 py-3"
                >
                  {/* Infos map */}
                  <div>
                    <p className="font-medium text-white">{map.name}</p>
                    <p className={`text-xs mt-0.5 ${DIFFICULTY_COLOR[map.difficulty]}`}>
                      {DIFFICULTY_LABEL[map.difficulty]}
                      {' · '}
                      {map.play_count} partie{map.play_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Zone joueur + bouton */}
                  <div className="flex items-center gap-3">
                    {/* Adversaire en attente */}
                    {hasOpponent && !isRegistered && (
                      <span className="text-sm text-white/70 font-medium">
                        {opponentEntry.player.username}
                      </span>
                    )}
                    {/* Moi-même inscrit */}
                    {isRegistered && (
                      <span className="text-sm text-deep-300 font-medium">
                        {user?.username}
                      </span>
                    )}

                    {isRegistered ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="opacity-60 cursor-default"
                      >
                        Inscrit
                      </Button>
                    ) : hasOpponent ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => joinLobby(map.id)}
                      >
                        Défier
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={maxReached || !connected}
                        onClick={() => { setError(null); joinLobby(map.id); }}
                      >
                        S'inscrire
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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
