// Scales the game frame to fit the available screen space while preserving its
// aspect ratio. Two shapes, picked from the pointer type:
//   - touch   → a square whose side is decided by CSS (.game-frame)
//   - desktop → the historical 4:3 box, sized from the parent's width
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useGameViewport } from '@/hooks/useGameViewport';

const LEADERBOARD_BREAKPOINT = 768;
const LEADERBOARD_RESERVED_WIDTH = 256 + 16;

interface ScaledGameFrameProps {
	children: ReactNode;
	/** Rendered above the game (spinners, state overlays...), unaffected by scale */
	overlay?: ReactNode;
}

export function ScaledGameFrame(props: ScaledGameFrameProps) {
	const { isTouch, width, height } = useGameViewport();

	return isTouch
		? <SquareFrame {...props} size={width} />
		: <FixedFrame {...props} width={width} height={height} />;
}

// ── Touch: square frame ─────────────────────────────────────────────────────
// The side comes from the stylesheet (full width in portrait, full height in
// landscape); the only thing JS does is mirror that side into the transform.

function SquareFrame({ children, overlay, size }: ScaledGameFrameProps & { size: number }) {
	const boxRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	// Layout effect: measured before paint, so the first frame is already at the
	// right scale instead of flashing the canvas at its native size.
	useLayoutEffect(() => {
		const el = boxRef.current;
		if (!el) return;

		const measure = () => {
			const boxWidth = el.clientWidth;
			// Ignore 0 (hidden tab, jsdom): it would blank the game out.
			if (boxWidth > 0) setScale(boxWidth / size);
		};

		measure();
		const resizeObserver = new ResizeObserver(measure);
		resizeObserver.observe(el);

		return () => resizeObserver.disconnect();
	}, [size]);

	return (
		<div ref={boxRef} className="game-frame overflow-hidden">
			{/* absolute: a fixed-size child in the flow would feed its own width
			    back into the observed box and loop the ResizeObserver. */}
			<div
				className="absolute left-0 top-0"
				style={{
					width: size,
					height: size,
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
				}}
			>
				{children}
			</div>
			{overlay}
		</div>
	);
}

// ── Desktop: historical 4:3 frame ───────────────────────────────────────────

function FixedFrame({ children, overlay, width, height }: ScaledGameFrameProps & { width: number; height: number }) {
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

			const nextScale = Math.min(1, availableWidth / width, availableHeight / height);
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
	}, [width, height]);

	return (
		<div ref={wrapperRef} className="relative shrink-0 mx-auto" style={{ width: width * scale }}>
			<div className="overflow-hidden" style={{ height: height * scale }}>
				<div
					style={{
						width,
						height,
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
