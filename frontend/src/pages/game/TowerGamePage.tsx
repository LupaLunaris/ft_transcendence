
import { useCallback, useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { AVATAR_TO_SPRITE, DEFAULT_PLAYER_SPRITE } from '@/game/assets';
import { useApi } from '@/hooks/useApi';
import { api, type TowerLevelFull } from '@/services/api.service';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { CongratulatoryModal } from '@/components/tower/CongratulatoryModal';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { ScaledGameFrame } from '@/components/game/ScaledGameFrame';

export function TowerGamePage() {
  const { order_index: orderIndexParam } = useParams<{ order_index: string }>();
  const orderIndex = parseInt(orderIndexParam ?? '1', 10);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [dead, setDead] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [runToken, setRunToken] = useState<string | null>(null);
  const [runStarting, setRunStarting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    tower_progress: number;
    diamonds: number;
  } | null>(null);

  const { data: level, loading, error, refetch } = useApi<TowerLevelFull>(
    () => api.tower.getLevel(orderIndex),
  );

  const isMounted = useRef(false);
  useLayoutEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    setDead(false);
    setShowModal(false);
    setCompletionData(null);
    setGameKey((k) => k + 1);
    refetch();
  }, [orderIndex, refetch]);

  useEffect(() => {
    if (!level || !user) return;

    let cancelled = false;

    async function startRun() {
      setRunToken(null);
      setRunStarting(true);

      try {
        const result = await api.tower.start(orderIndex);

        if (!cancelled) {
          setRunToken(result.run_token);
        }
      } catch {
        if (!cancelled) {
          navigate('/tower');
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
  }, [orderIndex, level?.id, user?.id, gameKey, navigate]);

  const handleDeath = useCallback(() => {
    setDead(true);
  }, []);

  const handleExitMap = useCallback(() => {
    navigate('/tower');
  }, [navigate]);

  const handleRestart = useCallback(() => {
    setDead(false);
    setGameKey((k) => k + 1);
  }, []);

  const handleExit = useCallback(
    async (_time_ms: number) => {
      try {
        if (!runToken) {
          navigate('/tower');
          return;
        }

        const result = await api.tower.complete(orderIndex, runToken);
        setRunToken(null);
        if (user) {
          updateUser({ ...user, tower_progress: result.tower_progress, diamonds: result.diamonds });
        }
        setCompletionData(result);
        setShowModal(true);
      } catch {
        // Level already completed (replay) or out-of-sequence — return to tower
        navigate('/tower');
      }
    },
    [orderIndex, user, updateUser, navigate, runToken],
  );

  const handleContinue = () => {
    setShowModal(false);
    if (orderIndex < 8) {
      navigate(`/play/tower/${orderIndex + 1}`);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    setShowModal(false);
    navigate('/');
  };

if (loading || runStarting || !runToken) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Spinner size="lg" className="text-gold-400" />
    </div>
  );
}

if (error || !level) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-ruby-400">
        {error ?? t('tower_game_page.no_level')}
      </p>
    </div>
  );
}

return (
  <>
    <div className="min-h-screen bg-surface flex flex-col items-center gap-4 p-4">
      <h2 className="guild-title font-fantasy text-xl font-semibold tracking-wide flex items-center gap-2">
        <img src="/assets/icons/tower.svg" alt="" className="h-6 w-6 object-contain opacity-80" />
        {t('tower_levels.level_' + orderIndex)}
      </h2>

      <p className="text-silver-400 text-xs uppercase tracking-widest">
        {t('tower_game_page.level', { orderIndex })}
      </p>

      <Button type="button" variant="secondary" size="sm" onClick={handleExitMap}>
        {t('tower_game_page.exit_level')}
      </Button>

      <p className="text-silver-500 text-sm">
        {t('game_page.instructions')}
      </p>

      <ScaledGameFrame>
        <GameCanvas
          key={gameKey}
          grid={level.grid_json}
          player_id={user!.id}
          player_sprite={AVATAR_TO_SPRITE[user!.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE}
          onExit={handleExit}
          onDeath={handleDeath}
        />
      </ScaledGameFrame>
    </div>

    <GameOverModal
      isOpen={dead}
      backLabel={t('tower_game_page.back_to_tower')}
      onRestart={handleRestart}
      onBack={() => navigate('/tower')}
    />

    <CongratulatoryModal
      isOpen={showModal}
      level={orderIndex}
      diamonds={completionData?.diamonds ?? 0}
      hasNextLevel={orderIndex < 8}
      onContinue={handleContinue}
      onHome={handleHome}
    />
  </>
);
}