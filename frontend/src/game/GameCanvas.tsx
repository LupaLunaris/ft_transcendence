
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Grid } from '@ft/shared';
import { GameScene } from './scenes/GameScene';

interface GameCanvasProps {
  grid: Grid;
  settings?: any;
  player_id: string;
  player_sprite?: string;
  onExit: (time_ms: number) => void;
  onDeath?: () => void;
}

const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;

	export function GameCanvas({
	grid,
	settings,
	player_id,
	player_sprite,
	onExit,
	onDeath
	}: GameCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const onExitRef = useRef(onExit);
	useEffect(() => { onExitRef.current = onExit; }, [onExit]);

	const onDeathRef = useRef(onDeath);
	useEffect(() => { onDeathRef.current = onDeath; }, [onDeath]);

	useEffect(() => {
		if (!containerRef.current) return;

		const config: Phaser.Types.Core.GameConfig = {
		type: Phaser.AUTO,
		parent: containerRef.current,
		width: CANVAS_WIDTH,
		height: CANVAS_HEIGHT,
		backgroundColor: '#0d1117',
		physics: {
			default: 'arcade',
			arcade: { gravity: { x: 0, y: 0 }, debug: false },
		},
		scene: [],
		};

		const game = new Phaser.Game(config);

		game.events.on('player_reached_exit', (time_ms: number) => {
		onExitRef.current(time_ms);
		});

		game.events.on('player_caught', () => {
		onDeathRef.current?.();
		});

		game.events.once('ready', () => {
		game.scene.add('GameScene', GameScene, true, {
			grid,
			settings,
			player_id,
			player_sprite,
		});
		});

		return () => {
		game.destroy(true);
		};
	}, []);

	return (
		<div
		ref={containerRef}
		style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
		/>
	);
	}
