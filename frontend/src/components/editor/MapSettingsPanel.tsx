import { MapSettings } from "../../types/map";

interface Props {
  settings: MapSettings;
  onChange: (settings: MapSettings) => void;
}

export default function MapSettingsPanel({ settings, onChange }: Props) {
  return (
	<div>
	  <h3>Map Settings</h3>

	  <label>
		Size:
		<select
		  value={settings.size}
		  onChange={(e) =>
			onChange({ ...settings, size: Number(e.target.value) })
		  }
		>
		  <option value={15}>15</option>
		  <option value={25}>25</option>
		  <option value={35}>35</option>
		</select>
	  </label>

	  <label>
		Enemies:
		<select
		  value={settings.enemyCount}
		  onChange={(e) =>
			onChange({ ...settings, enemyCount: Number(e.target.value) })
		  }
		>
		  <option value={0}>0</option>
		  <option value={2}>2</option>
		  <option value={5}>5</option>
		  <option value={10}>10</option>
		</select>
	  </label>

	  <label>
		Speed:
		<select
		  value={settings.enemySpeed}
		  onChange={(e) =>
			onChange({
			  ...settings,
			  enemySpeed: e.target.value as MapSettings["enemySpeed"],
			})
		  }
		>
		  <option value="slow">slow</option>
		  <option value="normal">normal</option>
		  <option value="fast">fast</option>
		</select>
	  </label>
	</div>
  );
}