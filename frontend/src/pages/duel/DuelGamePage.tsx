/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* DuelGamePage.tsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/27 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/27 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import type {
  DuelStartPayload,
  RaceResult,
  Direction,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@ft/shared';
import { useAuth } from '@/context/auth.context';
import { DuelScene } from '@/game/scenes/DuelScene';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';

type DuelSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const CANVAS_W = 800;
const CANVAS_H = 600;

// ─── Overlay résultat ─────────────────────────────────────────────────────────

function ResultOverlay({
  result,
  myId,
  onLeave,
}: {
  result: RaceResult;
  myId:   string;
  onLeave: () => void;
}) {
  const { t, i18n } = useTranslation();

  const won = result.winner_id === myId;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-5">
      <p className="text-5xl">{won ? '🏆' : '💀'}</p>
      <p className="text-2xl font-bold text-white font-fantasy">
        {won ? t('duel_game_page.win') : t('duel_game_page.lose')}
      </p>
      <p className="text-white/60 text-sm">
        {t('duel_game_page.time', { time: (result.duration_ms / 1000).toFixed(2) })}
      </p>
      <Button variant="primary" onClick={onLeave}>
        {t('duel_game_page.back_duel')}
      </Button>
    </div>
  );
}

// ─── DuelGamePage ─────────────────────────────────────────────────────────────

export function DuelGamePage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, token } = useAuth();
  const { t, i18n } = useTranslation();

  const state = location.state as DuelStartPayload | null;

  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const socketRef    = useRef<DuelSocket | null>(null);

  const [result,   setResult]   = useState<RaceResult | null>(null);
  const [waiting,  setWaiting]  = useState(true);

  // Redirige si on arrive sans state (navigation directe)
  useEffect(() => {
    if (!state) navigate('/duel', { replace: true });
  }, [state, navigate]);

  // ── Socket : connexion + join_race ────────────────────────────────────────
  useEffect(() => {
    if (!state || !token) return;

    const socket: DuelSocket = io({ auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('game_state', (gameState) => {
      if (!gameState.started) return;
      if (waiting) setWaiting(false);

      const remote = gameState.players.find(p => p.id !== user?.id);
      if (remote) gameRef.current?.events.emit('remote_state', remote);
    });

    socket.on('race_finished', (res) => {
      setResult(res);
    });

    socket.on('error_event', ({ message }) => {
      console.error('[duel game]', message);
    });

    socket.on('connect', () => {
      socket.emit('join_race', { race_id: state.race_id });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, state?.race_id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phaser : initialisation ───────────────────────────────────────────────
  useEffect(() => {
    if (!state || !containerRef.current || !user) return;

    const config: Phaser.Types.Core.GameConfig = {
      type:            Phaser.AUTO,
      parent:          containerRef.current,
      width:           CANVAS_W,
      height:          CANVAS_H,
      backgroundColor: '#0d1117',
      pixelArt:        false,
      physics: {
        default: 'arcade',
        arcade:  { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Phaser → React : input local
    game.events.on('emit_player_input', ({ direction }: { direction: Direction }) => {
      socketRef.current?.emit('player_input', { direction });
    });

    // Phaser → React : mort par ennemi
    game.events.on('player_caught', () => {
      socketRef.current?.emit('player_died');
    });

    game.events.once('ready', () => {
      game.scene.add('DuelScene', DuelScene, true, {
        grid:         state.grid,
        my_id:        user.id,
        my_username:  user.username,
        opponent:     state.opponent,
      });
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [state, user]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-4">
      {/* En-tête avec pseudo adversaire */}
      <div className="flex items-center gap-4 text-sm text-white/60">
        <span className="text-white font-medium">{user?.username}</span>
        <span className="text-white/30">vs</span>
        <span className="text-deep-300 font-medium">{state.opponent.username}</span>
      </div>

      {/* Zone de jeu */}
      <div className="relative">
        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden shadow-lg"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        />

        {/* Attente que les deux joueurs soient connectés */}
        {waiting && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3">
            <Spinner size="lg" className="text-deep-400" />
            <p className="text-white/70 text-sm">
              {t('duel_game_page.wait_other_player')}
            </p>
          </div>
        )}

        {result && (
          <ResultOverlay
            result={result}
            myId={user?.id ?? ''}
            onLeave={() => navigate('/duel')}
          />
        )}
      </div>

      <p className="text-white/40 text-sm">
        {t('duel_game_page.instructions')}
      </p>
    </div>
  );
}
