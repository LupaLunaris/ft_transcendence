// On-screen thumbstick for touch devices — replaces the former 4-button D-pad.
// Same contract as before: it only reports direction press/release, the scene
// owns the movement (cf. BaseScene.touchState).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Direction } from '@ft/shared';

interface JoystickProps {
  onDirection: (direction: Direction, pressed: boolean) => void;
}

const BASE = 144;                   // ring diameter, px
const THUMB = 64;
const TRAVEL = (BASE - THUMB) / 2;  // how far the thumb may leave the center
const DEAD_ZONE = 12;               // px before any direction registers
const AXIS_MARGIN = 8;              // px the other axis must lead by to take over

type Axis = 'x' | 'y';

export function Joystick({ onDirection }: JoystickProps) {
  // The callers declare onDirection inline (GameCanvas, DuelGamePage), so its
  // identity changes on every parent render. Going through a ref keeps the
  // unmount cleanup below from firing on a mere re-render — which would release
  // the direction the player is still holding.
  const onDirectionRef = useRef(onDirection);
  onDirectionRef.current = onDirection;

  const pointerIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef<Direction | null>(null);
  const axisRef = useRef<Axis | null>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Exactly ONE direction at a time, and always release the previous one first:
  // the scenes have no diagonals and resolve conflicts with a fixed
  // left>right>up>down priority, so a direction left pressed would win forever
  // (cf. GameScene.update).
  const setDirection = useCallback((next: Direction | null) => {
    const current = activeRef.current;
    if (current === next) return;
    if (current) onDirectionRef.current(current, false);
    activeRef.current = next;
    if (next) onDirectionRef.current(next, true);
  }, []);

  const track = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Clamp the thumb inside the ring, keeping the gesture's angle.
    const k = dist > TRAVEL ? TRAVEL / dist : 1;
    setOffset({ x: dx * k, y: dy * k });

    if (dist < DEAD_ZONE) {
      axisRef.current = null;
      setDirection(null);
      return;
    }

    // Sticky dominant axis: a bare |dx| vs |dy| comparison flaps near 45°, and
    // since a move is ignored mid-tween the flapping reads as random turns.
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    let axis = axisRef.current;
    if (axis === null) axis = ax >= ay ? 'x' : 'y';
    else if (axis === 'x' && ay > ax + AXIS_MARGIN) axis = 'y';
    else if (axis === 'y' && ax > ay + AXIS_MARGIN) axis = 'x';
    axisRef.current = axis;

    setDirection(
      axis === 'x'
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up'),
    );
  }, [setDirection]);

  const handleDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;   // ignore extra fingers
    e.preventDefault();

    // Cached once: the ring is fixed and the page root does not scroll, so the
    // center cannot move while dragging.
    const rect = e.currentTarget.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    // Track right away so a press landing off-center already moves.
    track(e.clientX, e.clientY);
  }, [track]);

  // No preventDefault here: touch-action:none already owns the gesture, and
  // React's delegated listener gives no guarantee of being non-passive.
  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerIdRef.current) return;
    track(e.clientX, e.clientY);
  }, [track]);

  // Idempotent: pointerup is followed by lostpointercapture, and the id guard
  // turns the second call into a no-op.
  const handleEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerIdRef.current) return;
    pointerIdRef.current = null;
    axisRef.current = null;
    setDirection(null);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
  }, [setDirection]);

  // Unmounting mid-hold (restart, navigation, death) must not leave
  // touchState[dir] = true behind for the next scene.
  useEffect(() => () => {
    if (activeRef.current) onDirectionRef.current(activeRef.current, false);
    activeRef.current = null;
  }, []);

  return (
    <div
      // Visible only where the primary pointer is coarse (phones, tablets).
      // z-30 keeps it under the modals and toasts (z-40/z-50) that the old
      // portaled z-50 pad used to cover.
      className="hidden [@media(pointer:coarse)]:block fixed z-30
        rounded-full bg-black/40 border border-gold-500/30 backdrop-blur-md
        touch-none select-none
        [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
      style={{
        right: 'max(1rem, env(safe-area-inset-right))',
        bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        width: BASE,
        height: BASE,
      }}
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onLostPointerCapture={handleEnd}
    >
      {/* pointer-events-none: the capture must stay on the ring, so the finger
          can leave the circle without the drag stopping. */}
      <div
        className={`absolute rounded-full bg-gold-500/30 border border-gold-300/50 pointer-events-none
          ${dragging ? '' : 'transition-transform duration-100'}`}
        style={{
          width: THUMB,
          height: THUMB,
          left: TRAVEL,
          top: TRAVEL,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      />
    </div>
  );
}
