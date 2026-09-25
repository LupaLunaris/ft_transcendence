
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { AchievementCode, Difficulty, RewardResult } from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { useMap } from '@/hooks/useMap';
import { useMapLeaderboard } from '@/hooks/useLeaderboard';
import { AVATAR_TO_SPRITE, DEFAULT_PLAYER_SPRITE } from '@/game/assets';
import { useToast } from '@/components/ui/useToast';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { api } from '@/services/api.service';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { ScaledGameFrame } from '@/components/game/ScaledGameFrame';

type EnemySpeed = 'slow' | 'normal' | 'fast';

type GameSettings = {
  size: number;
  enemyCount: number;
  enemySpeed: EnemySpeed;
};

const DIFFICULTY_TO_SPEED: Record<Difficulty, EnemySpeed> = {
  easy: 'slow',
  medium: 'normal',
  hard: 'fast',
};

const ACHIEVEMENT_LABEL: Record<AchievementCode, string> = {
  FIRST_ESCAPE: 'first_escape',
  FIRST_CREATOR: 'first_creator',
  EXPLORER: 'explorer',
  DUEL_CHAMPION: 'duel_champion',
};

function getEnemyDifficulty(value: unknown): Difficulty {
  return value === 'easy' || value === 'hard' || value === 'medium'
    ? value
    : 'medium';
}

export function GamePage() {
  const { map_id } = useParams<{ map_id: string }>();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { map, loading, error } = useMap(map_id);
  const { entries: leaderboardEntries, loading: leaderboardLoading } = useMapLeaderboard(map_id);
  const [dead, setDead] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [runToken, setRunToken] = useState<string | null>(null);
  const [runStarting, setRunStarting] = useState(false);
  const { t } = useTranslation();

  const handleDeath = useCallback(() => {
	setDead(true);
  }, []);

  const handleRestart = useCallback(() => {
	setDead(false);
	setGameKey((k) => k + 1);
  }, []);

  const handleExitMap = useCallback(() => {
	navigate(-1);
  }, [navigate]);

  const handleBack = useCallback(() => {
	if (map && user && map.creator_id === user.id) {
	  navigate(`/editor/${map_id}`);
	} else {
	  navigate('/train');
	}
  }, [map, user, map_id, navigate]);

  const handleReward = useCallback(
	async (reward?: RewardResult) => {
	  if (!reward || (reward.xp_gained === 0 && reward.achievements_unlocked.length === 0)) return;

	  if (reward.xp_gained > 0) {
		showToast(t('toast_xp_gained', { xp: reward.xp_gained }), 'success');
	  }
	  reward.achievements_unlocked.forEach((achievement) => {
		showToast(
		  t('toast_achievement_unlocked', { name: t(`achievement.${ACHIEVEMENT_LABEL[achievement.code]}`) }),
		  'success',
		);
	  });

	  try {
		updateUser(await api.auth.getMe());
	  } catch {
		// The next page load will refresh the profile if this background refresh fails.
	  }
	},
	[showToast, t, updateUser],
  );

  useEffect(() => {
    if (!map_id || !map || !user) return;

    const mapId = map_id;
    let cancelled = false;

    async function startRun() {
      setRunToken(null);
      setRunStarting(true);

	try {
	const run = await api.scores.start(mapId);

	if (!cancelled) {
		setRunToken(run.run_token);
	}
	} catch {
	if (!cancelled) {
		showToast(t('game_page.toast_score_error'), 'error');
	}
    } finally {
        if (!cancelled) {
          setRunStarting(false);
        }
      }
    }

    void startRun();

    return () => {
      cancelled = true;
    };
    // map/user are intentionally omitted: keying on their .id avoids
    // restarting the run (and burning a run_token) on every object refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map_id, map?.id, user?.id, gameKey, showToast, t]);

  const handleExit = useCallback(
	async (time_ms: number) => {
	  if (!map_id) return;
	  try {
		if (!runToken) {
		showToast(t('game_page.toast_score_error'), 'error');
		return;
	  }

		const result = await api.scores.submit(runToken, time_ms);
		setRunToken(null);
		showToast(t('game_page.toast_finished', { time: (time_ms / 1000).toFixed(2) }), 'success');
		await handleReward(result.reward);
	  } catch {
		showToast(t('game_page.toast_score_error'), 'error');
	  }
	  // Creator completing their own map: mark it done and return to editor to publish
	  if (map && user && map.creator_id === user.id) {
		try {
		  const completed = await api.maps.markComplete(map_id);
		  await handleReward(completed.reward);
		} catch {
		  // Silently ignore — map may already be marked complete
		}
		navigate(`/editor/${map_id}`);
	  } else {
		navigate('/train');
	  }
	},
	[map_id, map, user, navigate, showToast, t, handleReward, runToken],
  );

  if (loading) {
	return (
	  <div className="min-h-screen bg-surface flex items-center justify-center">
		<Spinner size="lg" className="text-deep-400" />
	  </div>
	);
  }

  if (error || !map) {
	return (
	  <div className="min-h-screen bg-surface flex items-center justify-center">
		<p className="text-coral-400">
		  {error ?? t('game_page.no_map')}
		</p>
	  </div>
	);
  }

  const backLabel = map && user && map.creator_id === user.id
	? t('game_page.backlabel_editor')
	: t('game_page.backlabel_train');
  const savedSettings = (map as typeof map & { settings?: Partial<GameSettings> }).settings;
  const enemyDifficulty = getEnemyDifficulty(
	(location.state as { enemyDifficulty?: unknown } | null)?.enemyDifficulty,
  );
  const enemySpeed = DIFFICULTY_TO_SPEED[enemyDifficulty];
  const settings: GameSettings = {
	size: savedSettings?.size ?? map.grid.length,
	enemyCount: savedSettings?.enemyCount ?? 2,
	enemySpeed,
  };

  if (runStarting || !runToken) {
	return (
	  <div className="min-h-screen bg-surface flex items-center justify-center">
		<Spinner size="lg" className="text-deep-400" />
      </div>
	);
  }

  return (
    <>
      <div className="game-screen">
        <header className="game-screen-header">
          <h2 className="min-w-0 truncate text-xl font-semibold text-silver-100 font-fantasy tracking-wide">
            {map.name}
          </h2>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExitMap}
          >
            {t('game_page.exit')}
          </Button>
        </header>

        <div className="game-screen-body">
          <ScaledGameFrame>
            <GameCanvas
              key={`${map.id}-${gameKey}-${enemySpeed}`}
              grid={map.grid}
              settings={settings}
              player_id={user!.id}
              player_sprite={AVATAR_TO_SPRITE[user!.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE}
              onExit={handleExit}
              onDeath={handleDeath}
            />
          </ScaledGameFrame>

          <Leaderboard
            title={t('leaderboard.map_title')}
            entries={leaderboardEntries}
            loading={leaderboardLoading}
            highlightUserId={user?.id}
            className="game-leaderboard"
          />
        </div>
      </div>

      <GameOverModal
        isOpen={dead}
        backLabel={backLabel}
        onRestart={handleRestart}
        onBack={handleBack}
      />
    </>
  );
}
