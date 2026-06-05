/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* TileSelector.tsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis        #+#    #+#               */
/* Updated: 2026/05/21 00:00:00 by jpaulis       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { TILE, type TileValue } from '@ft/shared';

interface TileSelectorProps {
  selected: TileValue;
  onChange: (tile: TileValue) => void;
}

const TILE_OPTIONS: Array<{ value: TileValue; label: string; color: string; description: string }> = [
  { value: TILE.EMPTY, label: 'Sol',     color: '#1f2933', description: 'Case vide' },
  { value: TILE.WALL,  label: 'Mur',     color: '#5b4636', description: 'Obstacle' },
  { value: TILE.EXIT,  label: 'Sortie',  color: '#00b894', description: 'Fin du niveau' },
  { value: TILE.SPAWN,   label: 'Spawn',    color: '#2f80ed', description: 'Départ du joueur' },
  { value: TILE.ENEMY_H, label: 'Ennemi H', color: '#c26a2e', description: 'Ennemi horizontal' },
  { value: TILE.ENEMY_V, label: 'Ennemi V', color: '#C2185B', description: 'Ennemi vertical' },
];

export function TileSelector({ selected, onChange }: TileSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Tuile active</p>
      <div className="flex flex-col gap-1">
        {TILE_OPTIONS.map(({ value, label, color, description }) => {
          const isActive = selected === value;
          return (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-surface-muted ring-2 ring-deep-400 text-white'
                  : 'bg-surface-raised hover:bg-surface-muted text-white/70 hover:text-white',
              ].join(' ')}
            >
              <span
                className="w-5 h-5 rounded shrink-0 border border-black/20"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1">
                <span className="text-sm font-medium block">{label}</span>
                <span className="text-xs text-white/40">{description}</span>
              </span>
              {isActive && (
                <span className="text-deep-300 text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
