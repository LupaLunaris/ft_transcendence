import { useEffect, useRef, useState, type ReactNode } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export function ScaledGameFrame({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !el.parentElement) return;

    const updateScale = () => {
      // clientWidth du PARENT (pas window.innerWidth) : reflète l'espace
      // réellement disponible après déduction de toute scrollbar déjà
      // présente, sans le décalage que window.innerWidth peut avoir.
      const width = el.parentElement!.clientWidth;
      const top = el.getBoundingClientRect().top;
      const availableHeight = window.innerHeight - top - 16;

      const nextScale = Math.min(1, width / GAME_WIDTH, availableHeight / GAME_HEIGHT);
      setScale(Math.max(0.35, nextScale));
    };

    updateScale();

    // Observe le PARENT, pas notre propre élément (dont la hauteur dépend
    // du scale qu'on vient de calculer) — sinon on s'auto-déclenche en boucle.
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(el.parentElement);
    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="w-full max-w-[800px] mx-auto">
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
    </div>
  );
}
