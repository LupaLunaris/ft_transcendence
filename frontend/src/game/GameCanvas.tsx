/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* GameCanvas.tsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/22 12:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Grid } from '@ft/shared';
import { GameScene } from './scenes/GameScene';
import { TILE_SIZE } from './scenes/BaseScene';
import { GRID_SIZE } from '@ft/shared';

interface GameCanvasProps {
  grid: Grid;
  player_id: string;
  onExit: (time_ms: number) => void;
  onDeath?: () => void;
}

const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;

export function GameCanvas({ grid, player_id, onExit, onDeath }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep callbacks stable so the effect doesn't re-run when parent re-renders
  const onExitRef = useRef(onExit);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);
  const onDeathRef = useRef(onDeath);
  useEffect(() => { onDeathRef.current = onDeath; }, [onDeath]);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width:  CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
		backgroundColor: '#0d1117',
	  pixelArt: false,
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      // Scene added dynamically after ready so we can pass data
      scene: [],
    };

    const game = new Phaser.Game(config);

    // Listen for the exit event on the global game emitter (no timing issue)
    game.events.on('player_reached_exit', (time_ms: number) => {
      onExitRef.current(time_ms);
    });

    game.events.on('player_caught', () => {
      onDeathRef.current?.();
    });

    game.events.once('ready', () => {
      // Add and immediately start the scene with grid data
      game.scene.add('GameScene', GameScene, true, { grid, player_id });
    });

    return () => {
      game.destroy(true);
    };
    // grid and player_id are stable per mount — they come from a fetch result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden shadow-lg"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    />
  );
}

// Suppress unused import warning — TILE_SIZE and GRID_SIZE used in sibling files
void TILE_SIZE;
void GRID_SIZE;
