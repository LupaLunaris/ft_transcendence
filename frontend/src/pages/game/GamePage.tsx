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

import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useMap } from '@/hooks/useMap';
import { useToast } from '@/components/ui/useToast';
import { Spinner } from '@/components/ui/Spinner';
import { GameCanvas } from '@/game/GameCanvas';
import { api } from '@/services/api.service';

export function GamePage() {
  const { map_id } = useParams<{ map_id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { map, loading, error } = useMap(map_id);

  const handleExit = useCallback(
    async (time_ms: number) => {
      if (!map_id) return;
      try {
        await api.scores.submit(map_id, time_ms);
        showToast(`Terminé en ${(time_ms / 1000).toFixed(2)}s !`, 'success');
      } catch {
        showToast('Score non enregistré', 'error');
      }
      navigate('/train');
    },
    [map_id, navigate, showToast],
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
        <p className="text-coral-400">{error ?? 'Map introuvable'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-xl font-semibold text-white font-fantasy tracking-wide">
        {map.name}
      </h2>
      <GameCanvas
        grid={map.grid}
        player_id={user!.id}
        onExit={handleExit}
      />
      <p className="text-white/40 text-sm">
        Utilisez les flèches ou WASD pour vous déplacer
      </p>
    </div>
  );
}
