import { useCallback, useRef } from 'react';
import type { Direction } from '@ft/shared';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight, } from "lucide-react";

interface TouchPadProps {
  onDirection: (direction: Direction, pressed: boolean) => void;
}

const ARROWS = [
  { dir: "up", icon: ArrowBigUp, className: "col-start-2 row-start-1" },
  { dir: "left", icon: ArrowBigLeft, className: "col-start-1 row-start-2" },
  { dir: "right", icon: ArrowBigRight, className: "col-start-3 row-start-2" },
  { dir: "down", icon: ArrowBigDown, className: "col-start-2 row-start-3" },
];

export function TouchPad({ onDirection }: TouchPadProps) {
  // Évite un double onDirection(dir, false) si pointerup ET pointercancel arrivent.
  const activeRef = useRef<Set<Direction>>(new Set());

  const start = useCallback((dir: Direction) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (activeRef.current.has(dir)) return;
    activeRef.current.add(dir);
    onDirection(dir, true);
  }, [onDirection]);

  const end = useCallback((dir: Direction) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!activeRef.current.has(dir)) return;
    activeRef.current.delete(dir);
    onDirection(dir, false);
  }, [onDirection]);

  return (
    <div className="fixed bottom-24 right-4 z-50 grid grid-cols-3 grid-rows-3 md:hidden">
      {ARROWS.map(({ dir, icon: Icon, className }) => (
        <button
          key={dir}
          type="button"
          className={`
            ${className}
            w-14 h-14
            flex items-center justify-center
            rounded-xl
            bg-black/50
            border border-yellow-500/30
            backdrop-blur-md
            active:bg-black/70
            active:scale-95
            transition-all
          `}
          onPointerDown={start(dir)}
          onPointerUp={end(dir)}
          onPointerCancel={end(dir)}
        >
          <Icon color="#cdb502" strokeWidth={2} size={32} />
        </button>
      ))}
    </div>
  );
}
