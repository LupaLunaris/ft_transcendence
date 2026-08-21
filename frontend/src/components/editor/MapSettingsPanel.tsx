// Displays and updates the configurable settings of a map.
import { MapSettings } from "../../types/map";

interface Props {
	settings: MapSettings;
	onChange: (settings: MapSettings) => void;
}

// Displays the map settings panel and notifies the parent when settings change.
export default function MapSettingsPanel({ settings, onChange }: Props) {
	return (
	<div className="bg-[#111] border border-[#444] rounded-lg p-4 flex flex-col gap-4">

		<h3 className="text-sm font-bold uppercase text-gray-300">
		Map Settings
		</h3>

		{/* SIZE */}
		<div className="flex flex-col gap-1">
		<label className="text-xs text-gray-400">Size</label>
		<select
			value={settings.size}
			onChange={(e) =>
			onChange({ ...settings, size: Number(e.target.value) })
			}
			className="bg-black border border-gray-600 p-1 rounded"
		>
			<option value={15}>15</option>
			<option value={25}>25</option>
			<option value={35}>35</option>
		</select>
		</div>

		{/* ENEMIES */}
		<div className="flex flex-col gap-1">
		<label className="text-xs text-gray-400">Enemies</label>
		<select
			value={settings.enemyCount}
			onChange={(e) =>
			onChange({ ...settings, enemyCount: Number(e.target.value) })
			}
			className="bg-black border border-gray-600 p-1 rounded"
		>
			<option value={0}>0</option>
			<option value={2}>2</option>
			<option value={5}>5</option>
			<option value={10}>10</option>
		</select>
		</div>

		{/* SPEED */}
		<div className="flex flex-col gap-1">
		<label className="text-xs text-gray-400">Speed</label>
		<select
			value={settings.enemySpeed}
			onChange={(e) =>
			onChange({
				...settings,
				enemySpeed: e.target.value as MapSettings["enemySpeed"],
			})
			}
			className="bg-black border border-gray-600 p-1 rounded"
		>
			<option value="slow">Slow</option>
			<option value="normal">Normal</option>
			<option value="fast">Fast</option>
		</select>
		</div>

	</div>
	);
}
