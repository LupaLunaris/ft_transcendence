
import { TILE, type TileValue } from '@ft/shared';
import { useTranslation } from 'react-i18next';

interface TileSelectorProps {
	selected: TileValue;
	onChange: (tile: TileValue) => void;
}

export function TileSelector({ selected, onChange }: TileSelectorProps) {
	const { t } = useTranslation();

	const TILE_OPTIONS: Array<{ value: TileValue; label: string; color: string; description: string }> = [
	{ value: TILE.EMPTY,   label: t('tile_selector.floor'),    color: '#1f2933', description: t('tile_selector.floor_d') },
	{ value: TILE.WALL,    label: t('tile_selector.wall'),     color: '#5b4636', description: t('tile_selector.wall_d') },
	{ value: TILE.EXIT,    label: t('tile_selector.exit'),     color: '#00b894', description: t('tile_selector.exit_d') },
	{ value: TILE.SPAWN,   label: t('tile_selector.spawn'),    color: '#2f80ed', description: t('tile_selector.spawn_d') },
	{ value: TILE.ENEMY_H, label: t('tile_selector.enemy_h'), color: '#c26a2e', description: t('tile_selector.enemy_h_d') },
	{ value: TILE.ENEMY_V, label: t('tile_selector.enemy_v'), color: '#C2185B', description: t('tile_selector.enemy_v_d') },
	] as const;

	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-xs font-medium text-white/50 uppercase tracking-wider">
				{t('tile_selector.active_tile')}
			</p>
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
								<span className="text-xs text-white/50">{description}</span>
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
