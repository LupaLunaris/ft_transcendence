// Single source of truth for "are we on a touch device, and how big is the
// game canvas then?" — shared by the Phaser canvas and by the frame that
// scales it, so the two can never disagree.
import { useEffect, useState } from 'react';
import {
	TOUCH_GAME_SIZE,
	TOUCH_CAMERA_ZOOM,
	DESKTOP_GAME_WIDTH,
	DESKTOP_GAME_HEIGHT,
	DESKTOP_CAMERA_ZOOM,
} from '@/game/constants';

// Same criterion as the on-screen controls: a coarse PRIMARY pointer means a
// phone or tablet, while a touchscreen laptop keeps its desktop layout.
const TOUCH_QUERY = '(pointer: coarse)';

export interface GameViewport {
	isTouch: boolean;
	/** Phaser canvas size, in backing-store pixels. */
	width: number;
	height: number;
	/** Camera zoom to pass to the scene, so `width / (TILE_SIZE * zoom)` tiles show. */
	zoom: number;
}

export function useGameViewport(): GameViewport {
	const [isTouch, setIsTouch] = useState(
		() => window.matchMedia?.(TOUCH_QUERY).matches ?? false,
	);

	useEffect(() => {
		const mql = window.matchMedia?.(TOUCH_QUERY);
		if (!mql) return;

		const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isTouch
		? { isTouch, width: TOUCH_GAME_SIZE, height: TOUCH_GAME_SIZE, zoom: TOUCH_CAMERA_ZOOM }
		: { isTouch, width: DESKTOP_GAME_WIDTH, height: DESKTOP_GAME_HEIGHT, zoom: DESKTOP_CAMERA_ZOOM };
}
