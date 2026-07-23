
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Difficulty, DuelStartPayload } from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { usePublishedMaps } from '@/hooks/useMap';
import { useDuelLobby } from '@/hooks/useDuelLobby';
import { useGlobalLeaderboard } from '@/hooks/useLeaderboard';
import { Layout } from '@/components/layout/Layout';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';

const DIFFICULTIES: { value: Difficulty | undefined; key: string }[] = [
  { value: undefined, key: 'duel_page.difficulty_all' },
  { value: 'easy',   key: 'duel_page.difficulty_easy' },
  { value: 'medium', key: 'duel_page.difficulty_medium' },
  { value: 'hard',   key: 'duel_page.difficulty_hard' },
] as const;

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy:   'duel_page.difficulty_easy',
  medium: 'duel_page.difficulty_medium',
  hard:   'duel_page.difficulty_hard',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy:   'text-deep-300',
  medium: 'text-yellow-400',
  hard:   'text-coral-400',
};

const PAGE_SIZE = 20;
// Doit rester synchronisé avec MAX_RACE_PLAYERS dans backend/src/socket/duelHandler.ts
const MAX_LOBBY_PLAYERS = 4;

export function DuelPage() {
  const navigate    = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();

  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [page,       setPage]       = useState(1);
  const [error,      setError]      = useState<string | null>(null);

  const { maps, total, loading, error: mapsError } = usePublishedMaps(page, difficulty);
  const { entries: leaderboardEntries, loading: leaderboardLoading } = useGlobalLeaderboard();

  const handleDuelStart = useCallback((payload: DuelStartPayload) => {
    navigate('/duel/game', { state: payload });
  }, [navigate]);

  const { lobbyEntries, myRegistrations, joinLobby, connected } = useDuelLobby({
    token,
    userId: user?.id ?? null,
    onDuelStart: handleDuelStart,
    onError: (msg) => setError(msg),
  });

  // Force un re-render chaque seconde pour rafraîchir le compte à rebours
  // affiché (dérivé de countdown_ends_at - Date.now(), pas d'état serveur poussé).
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function handleDifficulty(value: Difficulty | undefined) {
    setDifficulty(value);
    setPage(1);
  }

  const maxReached = myRegistrations.size >= 3;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide">
            ⚔️ {t('duel_page.duel')}
          </h1>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-white/20'}`} />
            {connected ? t('common.online') : t('common.login')}
          </div>
        </div>

        {error && (
          <p className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/30 rounded px-3 py-2">
            {error}
          </p>
        )}

        {maxReached && (
          <p className="text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/30 rounded px-3 py-2">
            {t('duel_page.too_many_maps')}
          </p>
        )}

        {/* Filtre difficulté */}
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, key }) => (
            <button
              key={key}
              onClick={() => handleDifficulty(value)}
              className={[
                'px-3 py-1 rounded text-sm font-medium border transition-colors',
                difficulty === value
                  ? 'bg-deep-700 border-deep-400 text-white'
                  : 'bg-transparent border-surface-border text-white/60 hover:text-white',
              ].join(' ')}
            >
              {t(key)}
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
            {t('duel_page.no_published_map')}
          </p>
        )}

        {!loading && !mapsError && maps.length > 0 && (
          <div className="flex flex-col gap-3">
            {maps.map((map) => {
              const entry = lobbyEntries.find(e => e.map_id === map.id);
              const count = entry?.players.length ?? 0;
              const isRegistered = myRegistrations.has(map.id);
              const isFull = count >= MAX_LOBBY_PLAYERS;
              const secondsLeft = entry?.countdown_ends_at
                ? Math.max(0, Math.ceil((entry.countdown_ends_at - Date.now()) / 1000))
                : null;

              return (
                <div
                  key={map.id}
                  className="flex items-center justify-between bg-surface-raised border border-surface-border rounded-lg px-4 py-3"
                >
                  {/* Infos map */}
                  <div>
                    <p className="font-medium text-white">{map.name}</p>
                    <p className={`text-xs mt-0.5 ${DIFFICULTY_COLOR[map.difficulty]}`}>
                      {t(DIFFICULTY_LABEL[map.difficulty])}
                      {' · '}
                      {t('duel_page.play_count', { count: map.play_count })}
                    </p>
                  </div>

                  {/* Zone lobby + bouton */}
                  <div className="flex items-center gap-3">
                    {count > 0 && (
                      <span className="text-sm text-white/70 font-medium">
                        {t('duel_page.registered_count', { count, max: MAX_LOBBY_PLAYERS })}
                        {secondsLeft !== null && ` · ${t('duel_page.starts_in', { seconds: secondsLeft })}`}
                      </span>
                    )}

                    {isRegistered ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="opacity-60 cursor-default"
                      >
                        {t('duel_page.registered')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={maxReached || !connected || isFull}
                        onClick={() => { setError(null); joinLobby(map.id); }}
                      >
                        {isFull ? t('duel_page.full') : t('common.to_register')}
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
              {t('common.previous')}
            </Button>
            <span className="text-white/50 text-sm">
              {t('common.page', { current: page, total: Math.ceil(total / PAGE_SIZE) })}            </span>
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

      <Leaderboard
        title={t('leaderboard.global_title')}
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        highlightUserId={user?.id}
        className="w-full lg:w-64 shrink-0"
      />
      </div>
    </Layout>
  );
}
