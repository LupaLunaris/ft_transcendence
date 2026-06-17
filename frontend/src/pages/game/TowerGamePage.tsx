/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* TowerGamePage.tsx                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useCallback, useState, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useApi } from '@/hooks/useApi';
import { api, type TowerLevelFull } from '@/services/api.service';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { CongratulatoryModal } from '@/components/tower/CongratulatoryModal';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function TowerGamePage() {
  const { order_index: orderIndexParam } = useParams<{ order_index: string }>();
  const orderIndex = parseInt(orderIndexParam ?? '1', 10);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [dead, setDead] = useState(false);
  const [gameKey, setGameKey] = useState(0);
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
        const result = await api.tower.complete(orderIndex);
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
    [orderIndex, user, updateUser, navigate],
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

if (loading) {
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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
      <h2 className="guild-title font-fantasy text-xl font-semibold tracking-wide flex items-center gap-2">
        <img src="/assets/icons/tower.svg" alt="" className="h-6 w-6 object-contain opacity-80" />
        {level.name}
      </h2>

      <p className="text-silver-400 text-xs uppercase tracking-widest">
        {t('tower_game_page.level', { orderIndex })}
      </p>

      <GameCanvas
        key={gameKey}
        grid={level.grid_json}
        player_id={user!.id}
        onExit={handleExit}
        onDeath={handleDeath}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleExitMap}
      >
        {t('tower_game_page.exit_level')}
      </Button>

      <p className="text-silver-400 text-sm">
        {t('game_page.instructions')}
      </p>
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