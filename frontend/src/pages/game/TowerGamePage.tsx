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

export function TowerGamePage() {
  const { order_index: orderIndexParam } = useParams<{ order_index: string }>();
  const orderIndex = parseInt(orderIndexParam ?? '1', 10);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

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
  useEffect(() => {
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
        <Spinner size="lg" className="text-deep-400" />
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-coral-400">{error ?? 'Niveau introuvable'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
        <h2 className="text-xl font-semibold text-white font-fantasy tracking-wide">
          🗼 {level.name}
        </h2>
        <p className="text-white/40 text-xs uppercase tracking-widest">
          Niveau {orderIndex} / 8
        </p>
        <GameCanvas
          key={gameKey}
          grid={level.grid_json}
          player_id={user!.id}
          onExit={handleExit}
          onDeath={handleDeath}
        />
        <p className="text-white/40 text-sm">
          Utilisez les flèches ou WASD pour vous déplacer
        </p>
      </div>

      <GameOverModal
        isOpen={dead}
        backLabel="Retour à la tour"
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
