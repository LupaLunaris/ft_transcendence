
import { useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Difficulty } from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { useMap } from '@/hooks/useMap';
import { AVATAR_TO_SPRITE, DEFAULT_PLAYER_SPRITE } from '@/game/assets';
import { useToast } from '@/components/ui/useToast';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { GameOverModal } from '@/components/game/GameOverModal';
import { api } from '@/services/api.service';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

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

function getEnemyDifficulty(value: unknown): Difficulty {
  return value === 'easy' || value === 'hard' || value === 'medium'
    ? value
    : 'medium';
}

export function GamePage() {
  const { map_id } = useParams<{ map_id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { map, loading, error } = useMap(map_id);
  const [dead, setDead] = useState(false);
  const [gameKey, setGameKey] = useState(0);
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

  const handleExit = useCallback(
	async (time_ms: number) => {
	  if (!map_id) return;
	  try {
		await api.scores.submit(map_id, time_ms);
		showToast(t('game_page.toast_finished', { time: (time_ms / 1000).toFixed(2) }), 'success');
	  } catch {
		showToast(t('game_page.toast_score_error'), 'error');
	  }
	  // Creator completing their own map: mark it done and return to editor to publish
	  if (map && user && map.creator_id === user.id) {
		try {
		  await api.maps.markComplete(map_id);
		} catch {
		  // Silently ignore — map may already be marked complete
		}
		navigate(`/editor/${map_id}`);
	  } else {
		navigate('/train');
	  }
	},
	[map_id, map, user, navigate, showToast],
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

  return (
	<>
	  <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
		<h2 className="text-xl font-semibold text-silver-100 font-fantasy tracking-wide">
		  {map.name}
		</h2>
		<GameCanvas
			key={`${map.id}-${gameKey}-${enemySpeed}`}
			grid={map.grid}
			settings={settings}
			player_id={user!.id}
			player_sprite={AVATAR_TO_SPRITE[user!.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE}
			onExit={handleExit}
			onDeath={handleDeath}
			/>
				<Button
		  type="button"
		  variant="secondary"
		  size="sm"
		  onClick={handleExitMap}
		>
		  {t('game_page.exit')}
		</Button>
		<p className="text-white/40 text-sm">
		  {t('game_page.instructions')}
		</p>
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
