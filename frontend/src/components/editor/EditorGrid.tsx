/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* EditorGrid.tsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { TILE, GRID_SIZE, type Grid, type TileValue } from '@ft/shared';

interface EditorGridProps {
  grid: Grid;
  selectedTile: TileValue;
  onTileClick: (x: number, y: number) => void;
}

function tileColor(tile: TileValue): string {
  switch (tile) {
    case TILE.WALL:  return '#5c3d8f';
    case TILE.EXIT:  return '#00e5a0';
    case TILE.SPAWN: return '#f4511e';
    case TILE.ENEMY: return '#e53935';
    default:         return '#2a2a3e'; // EMPTY
  }
}

function tileBorder(tile: TileValue): string {
  if (tile === TILE.WALL) return '1px solid #3d2a5c';
  return '1px solid #1a1a2e';
}

export function EditorGrid({ grid, onTileClick }: EditorGridProps) {
  return (
    <div
      className="inline-block border border-surface-border rounded overflow-hidden cursor-crosshair select-none"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)`,
        gap: 0,
      }}
      // Prevent context menu on right-click drag
      onContextMenu={(e) => e.preventDefault()}
    >
      {grid.map((row, rowIdx) =>
        row.map((tile, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            style={{
              width: 22,
              height: 22,
              backgroundColor: tileColor(tile),
              border: tileBorder(tile),
              transition: 'opacity 0.05s',
            }}
            className="hover:opacity-75"
            onClick={() => onTileClick(colIdx, rowIdx)}
            onMouseEnter={(e) => {
              // Paint on drag (left button held)
              if (e.buttons === 1) onTileClick(colIdx, rowIdx);
            }}
          />
        )),
      )}
    </div>
  );
}
