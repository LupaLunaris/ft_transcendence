// Scales the game frame to fit the available screen space while preserving its aspect ratio.
import { useEffect, useRef, useState, type ReactNode } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LEADERBOARD_BREAKPOINT = 768;
const LEADERBOARD_RESERVED_WIDTH = 256 + 16;

interface ScaledGameFrameProps {
	children: ReactNode;
	/** Rendered above the game (spinners, state overlays...), unaffected by scale */
	overlay?: ReactNode;
}

export function ScaledGameFrame({ children, overlay }: ScaledGameFrameProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const el = wrapperRef.current;
		if (!el || !el.parentElement) return;

		const updateScale = () => {
			const parentWidth = el.parentElement!.clientWidth;
			const leaderboardVisible = window.innerWidth >= LEADERBOARD_BREAKPOINT;
			const availableWidth = leaderboardVisible
				? parentWidth - LEADERBOARD_RESERVED_WIDTH
				: parentWidth;

			const top = el.getBoundingClientRect().top;
			const availableHeight = window.innerHeight - top - 16;

			const nextScale = Math.min(1, availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT);
			setScale(Math.max(0.35, nextScale));
		};

		updateScale();

		// Observe the PARENT, not our own element (whose height depends
		// on the scale we just computed) — otherwise we trigger ourselves in a loop.
		const resizeObserver = new ResizeObserver(updateScale);
		resizeObserver.observe(el.parentElement);
		window.addEventListener('resize', updateScale);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateScale);
		};
	}, []);

	return (
		<div ref={wrapperRef} className="relative shrink-0 mx-auto" style={{ width: GAME_WIDTH * scale }}>
			<div className="overflow-hidden" style={{ height: GAME_HEIGHT * scale }}>
				<div
					style={{
						width: GAME_WIDTH,
						height: GAME_HEIGHT,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
				>
					{children}
				</div>
			</div>
			{overlay}
		</div>
	);
}
