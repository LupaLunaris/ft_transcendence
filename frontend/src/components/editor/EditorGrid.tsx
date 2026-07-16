
import { TILE_SIZE } from '@/game/scenes/BaseScene';
import { TILE, GRID_SIZE, type Grid, type TileValue } from '@ft/shared';

interface EditorGridProps {
  grid: Grid;
  selectedTile: TileValue;
  onTileClick: (x: number, y: number) => void;
  onTileRightClick?: (x: number, y: number) => void;
}

function tileColor(tile: TileValue, row: number, col: number): string {
	const isOuterWall =
		row === 0 ||
		row === GRID_SIZE - 1 ||
		col === 0 ||
		col === GRID_SIZE - 1;

  if (tile === TILE.WALL && isOuterWall) return '#2a2520';
  if (tile === TILE.WALL) return '#5b4a3a';

  switch (tile) {
	case TILE.EXIT:    return '#10b981';
	case TILE.SPAWN:   return '#3b82f6';
	case TILE.ENEMY_H: return '#d97706';
	case TILE.ENEMY_V: return '#be185d';
	default:           return '#121826';
  }
}

function tileBorder(tile: TileValue): string {
  if (tile === TILE.WALL) return '1px solid #4131229a';
  return '1px solid #202a3a7a';
}

export function EditorGrid({ grid, onTileClick, onTileRightClick }: EditorGridProps) {
  const size = grid.length || GRID_SIZE;

  return (
	<div
	  className="grid border border-surface-border rounded overflow-hidden cursor-crosshair select-none"
	  style={{
		gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
		gridAutoRows: '1fr',
		width: `min(100%, ${size * TILE_SIZE}px)`,
		aspectRatio: '1 / 1',
		gap: 0,
	  }}
	>
	  {grid.flatMap((row, rowIdx) =>
  		row.map((tile, colIdx) => (
		  <div
			key={`${rowIdx}-${colIdx}`}
			style={{
			  width: '100%',
			  aspectRatio: '1 / 1',
			  backgroundColor: tileColor(tile, rowIdx, colIdx),
			  border: tileBorder(tile),
			  transition: 'opacity 0.05s',
			}}
			className="hover:opacity-75"
			onClick={() => onTileClick(colIdx, rowIdx)}
			onContextMenu={(e) => {
			  e.preventDefault();
			  onTileRightClick?.(colIdx, rowIdx);
			}}
			onMouseEnter={(e) => {
			  if (e.buttons === 1) onTileClick(colIdx, rowIdx);
			  if (e.buttons === 2) onTileRightClick?.(colIdx, rowIdx);
			}}
		  />
		)),
	  )}
	</div>
  );
}
