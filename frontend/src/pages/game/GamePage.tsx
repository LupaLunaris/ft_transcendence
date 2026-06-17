/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* GamePage.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useMap } from '@/hooks/useMap';
import { useToast } from '@/components/ui/useToast';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { GameOverModal } from '@/components/game/GameOverModal';
import { api } from '@/services/api.service';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function GamePage() {
  const { map_id } = useParams<{ map_id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
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

  return (
    <>
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
        <h2 className="text-xl font-semibold text-silver-100 font-fantasy tracking-wide">
          {map.name}
        </h2>
        <GameCanvas
          key={gameKey}
          grid={map.grid}
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
