// Connects React to Phaser by creating the game, passing initial data, and forwarding game events back to React.
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Grid, Direction } from '@ft/shared';
import { GameScene } from './scenes/GameScene';
import { Joystick } from '@/components/ui/Joystick';
import { useGameViewport } from '@/hooks/useGameViewport';
import { createPortal } from 'react-dom';

interface GameCanvasProps {
  grid: Grid;
  settings?: any;
  player_id: string;
  player_sprite?: string;
  onExit: (time_ms: number) => void;
  onDeath?: () => void;
}

	export function GameCanvas({
	grid,
	settings,
	player_id,
	player_sprite,
	onExit,
	onDeath
	}: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Phaser.Game | null>(null);
	const initialGameConfigRef = useRef({ grid, settings, player_id, player_sprite });

	// Frozen at mount like the config above: the canvas size is baked into the
	// Phaser game, so switching pointer type mid-run would mean rebuilding it
	// (only reachable through DevTools emulation — reload the page there).
	const { width: canvasWidth, height: canvasHeight, zoom: cameraZoom } = useGameViewport();
	const viewportRef = useRef({ width: canvasWidth, height: canvasHeight, zoom: cameraZoom });

	const onExitRef = useRef(onExit);
	useEffect(() => { onExitRef.current = onExit; }, [onExit]);

	const onDeathRef = useRef(onDeath);
	useEffect(() => { onDeathRef.current = onDeath; }, [onDeath]);

	useEffect(() => {
		if (!containerRef.current) return;

		const config: Phaser.Types.Core.GameConfig = {
		type: Phaser.AUTO,
		parent: containerRef.current,
		width: viewportRef.current.width,
		height: viewportRef.current.height,
		backgroundColor: '#0d1117',
		physics: {
			default: 'arcade',
			arcade: { gravity: { x: 0, y: 0 }, debug: false },
		},
		scene: [],
		};

		const game = new Phaser.Game(config);
		gameRef.current = game;

		game.events.on('player_reached_exit', (time_ms: number) => {
		onExitRef.current(time_ms);
		});

		game.events.on('player_caught', () => {
		onDeathRef.current?.();
		});

		game.events.once('ready', () => {
			const initialGameConfig = initialGameConfigRef.current;
			game.scene.add('GameScene', GameScene, true, {
				grid: initialGameConfig.grid,
				settings: initialGameConfig.settings,
				player_id: initialGameConfig.player_id,
				player_sprite: initialGameConfig.player_sprite,
				camera_zoom: viewportRef.current.zoom,
			});
		});

		return () => {
		game.destroy(true);
		gameRef.current = null;
		};
	}, []);

	  const handleDirection = (direction: Direction, pressed: boolean) => {
      gameRef.current?.events.emit('touch_input', { direction, pressed });
  	};

	return (
	  <>
		<div
		ref={containerRef}
		style={{ width: viewportRef.current.width, height: viewportRef.current.height }}
		/>
      	{createPortal(<Joystick onDirection={handleDirection} />, document.body)}	  </>
	);
	}
