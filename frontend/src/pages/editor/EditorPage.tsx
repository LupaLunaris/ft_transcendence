
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TILE, GRID_SIZE, type Grid, type TileValue, type MapData } from '@ft/shared';
import { api, type AdminMap } from '@/services/api.service';
import { useAuth } from '@/context/auth.context';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Layout } from '@/components/layout/Layout';
import { EditorGrid } from '@/components/editor/EditorGrid';
import { TileSelector } from '@/components/editor/TileSelector';
import { useMyMaps } from '@/hooks/useMap';
import { useTranslation } from 'react-i18next';
import MapSettingsPanel from "@/components/editor/MapSettingsPanel";

const ERROR_MAP: Record<string, string> = {
  'Invalid grid: must be 25x25 with WALL borders, valid tile values, exactly 1 SPAWN and 1 EXIT': 'errors.invalid_grid',
  'No clear path from SPAWN to EXIT': 'errors.no_path',
  'Name is required': 'errors.name_required',
};

function getErrorKey(err: unknown, fallback: string): string {
  const message = (err as { error?: string })?.error ?? '';
  return ERROR_MAP[message] ?? fallback;
}

function makeEmptyGrid(): Grid {
  const grid = Array.from({ length: GRID_SIZE }, () =>
	Array.from({ length: GRID_SIZE }, () => TILE.WALL as TileValue),
  ) as Grid;

  grid[1][1] = TILE.SPAWN;
  grid[GRID_SIZE - 2][GRID_SIZE - 2] = TILE.EXIT;

  return grid;
}

export function EditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [grid, setGrid] = useState<Grid>(makeEmptyGrid);
  const [settings, setSettings] = useState<{
	size: number;
	enemyCount: number;
	enemySpeed: 'slow' | 'normal' | 'fast';
	}>({
	size: GRID_SIZE,
	enemyCount: 2,
	enemySpeed: 'normal',
	});
  const [selectedTile, setSelectedTile] = useState<TileValue>(TILE.EMPTY);
  const [mapName, setMapName] = useState('');
  const [mapId, setMapId] = useState<string | null>(id ?? null);
  const [creatorCompleted, setCreatorCompleted] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [loadingMap, setLoadingMap] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const { maps: myMaps, loading: loadingMyMaps, refetch: refetchMyMaps } = useMyMaps();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedTestModal, setShowUnsavedTestModal] = useState(false);

  // Admin mode — initialized directly from user.is_admin (ProtectedRoute guarantees user
  // is non-null at mount time, so no extra render cycle is needed)
  const [adminMode, setAdminMode] = useState(() => !!user?.is_admin);
  const [adminLevels, setAdminLevels] = useState<AdminMap[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loadingAdminLevels, setLoadingAdminLevels] = useState(false);

  // Load existing map when editing
  useEffect(() => {
	if (!id) return;
	api.maps
	  .getById(id)
	  .then((map) => {
		setGrid(map.grid);
		setMapName(map.name);
		setMapId(map.id);
		setCreatorCompleted(map.creator_completed);
		setIsPublished(map.published);
		setHasUnsavedChanges(false);
	  })
	  .catch(() => showToast(t('editor_page.toast_load_error'), 'error'))
	  .finally(() => setLoadingMap(false));
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load admin levels once when entering admin mode
  useEffect(() => {
	if (!adminMode) return;
	setLoadingAdminLevels(true);
	api.admin
	  .getTowerLevels()
	  .then(setAdminLevels)
	  .catch(() => showToast(t('editor_page.toast_admin_levels_error'), 'error'))
	  .finally(() => setLoadingAdminLevels(false));
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode]);

  const setTile = useCallback((x: number, y: number) => {
	// Borders are always WALL — protect them in the editor
	if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) return;
	setGrid((prev) => {
	  const next = prev.map((row) => [...row]) as Grid;
	  next[y][x] = selectedTile;
	  return next;
	});
	setHasUnsavedChanges(true);
  }, [selectedTile]);

  const clearTile = useCallback((x: number, y: number) => {
	if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) return;
	setGrid((prev) => {
	  const next = prev.map((row) => [...row]) as Grid;
	  next[y][x] = TILE.EMPTY;
	  return next;
	});
	setHasUnsavedChanges(true);
  }, []);

  const handleSelectAdminLevel = (level: AdminMap) => {
	setSelectedLevel(level.order_index);
	setGrid(level.grid_json);
	setMapName(t('tower_levels.level_' + level.order_index));
  };

  const handleLoadMap = (map: MapData) => {
	setHasUnsavedChanges(false);
	setGrid(map.grid);
	setMapName(map.name);
	setMapId(map.id);
	setIsPublished(map.published);
	setCreatorCompleted(map.creator_completed);
	navigate(`/editor/${map.id}`, { replace: true });
  };

  const handleDeleteConfirm = async () => {
	if (!mapToDelete) return;
	setDeleting(true);
	try {
	  await api.maps.delete(mapToDelete);
	  if (mapToDelete === mapId) {
		setGrid(makeEmptyGrid());
		setMapName('');
		setMapId(null);
		setIsPublished(false);
		setCreatorCompleted(false);
		setHasUnsavedChanges(false);
		navigate('/editor', { replace: true });
	  }
	  refetchMyMaps();
	  showToast(t('editor_page.toast_delete_ok'), 'success');
	} catch {
	  showToast(t('editor_page.toast_delete_error'), 'error');
	} finally {
	  setDeleting(false);
	  setShowDeleteModal(false);
	  setMapToDelete(null);
	}
  };

  const handleSave = async (): Promise<boolean> => {
	if (adminMode) {
	  if (selectedLevel === null) {
		showToast(t('editor_page.toast_select_level'), 'error');
		return false;
	  }
	  setSaving(true);
	  try {
		const updated = await api.admin.updateTowerLevel(selectedLevel, {
		  name: mapName || t('editor_page.level', { n: selectedLevel }),
		  grid_json: JSON.stringify(grid),
		});
		// Sync local cache — upsert: replace if exists, append if new
		setAdminLevels((prev) => {
		  const exists = prev.some((l) => l.order_index === selectedLevel);
		  return exists
			? prev.map((l) => (l.order_index === selectedLevel ? updated : l))
			: [...prev, updated].sort((a, b) => a.order_index - b.order_index);
		});
		showToast(t('editor_page.toast_save_level_ok', { level: selectedLevel }), 'success');
		setHasUnsavedChanges(false);
		return true;
	  } catch (err) {
		showToast(t(getErrorKey(err, 'editor_page.toast_save_error')), 'error');
		return false;
	  } finally {
		setSaving(false);
	  }
	}

	if (!mapName.trim()) {
	  showToast(t('editor_page.toast_name_required'), 'error');
	  return false;
	}
	setSaving(true);
	try {
	  if (mapId) {
		await api.maps.update(mapId, { name: mapName, grid });
	  } else {
		const created = await api.maps.create({ name: mapName, grid });
		setMapId(created.id);
		navigate(`/editor/${created.id}`, { replace: true });
	  }
	  showToast(t('editor_page.toast_save_ok'), 'success');
	  setHasUnsavedChanges(false);
	  return true;
	} catch (err) {
	  showToast(t(getErrorKey(err, 'editor_page.toast_save_error')), 'error');
	  return false;
	} finally {
	  setSaving(false);
	}
  };

  const handlePublish = async () => {
	if (!mapId) {
	  showToast(t('editor_page.toast_save_first'), 'error');
	  return;
	}
	setPublishing(true);
	setShowPublishModal(false);
	try {
	  await api.maps.publish(mapId);
	  setIsPublished(true);
	  showToast(t('editor_page.toast_publish_ok'), 'success');
	  navigate('/train');
	} catch (err) {
	  const msg = err && typeof err === 'object' && 'error' in err
		? String((err as { error: string }).error)
		: t('editor_page.toast_publish_error');
	  showToast(msg, 'error');
	} finally {
	  setPublishing(false);
	}
  };

  const handlePublishClick = () => {
  if (hasUnsavedChanges) {
	showToast(t('editor_page.toast_unsaved_before_publish'), 'error');
	return;
  }
  setShowPublishModal(true);
  };

  const handleUnpublish = async () => {
	if (!mapId) return;
	setUnpublishing(true);
	try {
	  await api.maps.unpublish(mapId);
	  setIsPublished(false);
	  showToast(t('editor_page.toast_unpublish_ok'), 'success');
	} catch (err) {
	  const msg = err && typeof err === 'object' && 'error' in err
		? String((err as { error: string }).error)
		: t('editor_page.toast_unpublish_error');
	  showToast(msg, 'error');
	} finally {
	  setUnpublishing(false);
	}
  };

  const handleTest = () => {
	if (!mapId) {
	  showToast(t('editor_page.toast_save_first'), 'error');
	  return;
	}
	if (hasUnsavedChanges) {
	setShowUnsavedTestModal(true);
	return;
  }
	navigate(`/play/${mapId}`);
  };

  const handleSaveAndTest = async () => {
  setShowUnsavedTestModal(false);
  const success = await handleSave();
  if (success && mapId) {
	navigate(`/play/${mapId}`);
  }
  };

  if (loadingMap) {
	return (
	  <Layout>
		<div className="flex items-center justify-center h-[80vh]">
		  <Spinner size="lg" className="text-deep-400" />
		</div>
	  </Layout>
	);
  }

  const saveLabel = adminMode && selectedLevel !== null
	? t('editor_page.save_level', { level: selectedLevel })
	: t('editor_page.save');

  return (
	<Layout>
	  <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
		<div className="flex items-center justify-between flex-wrap gap-3">
		  <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide flex items-center gap-3">
			{adminMode
			  ? selectedLevel !== null
				? t('editor_page.title_admin_level', { level: selectedLevel })
				: t('editor_page.title_admin')
			  : mapId
				? isPublished ? t('editor_page.title_published') 
				: t('editor_page.title_edit')
				: t('editor_page.title_new')
			}
		  </h1>
		  <div className="flex gap-2 flex-wrap">
			{user?.is_admin && (
			  <Button
				variant={adminMode ? 'primary' : 'ghost'}
				size="sm"
				onClick={() => {
				  setAdminMode((v) => !v);
				  if (adminMode) setSelectedLevel(null);
				}}
			  >
				{t('editor_page.admin_mode')}
			  </Button>
			)}
			{!adminMode && (
			  <Button variant="secondary" size="sm" onClick={handleTest} disabled={!mapId || isPublished}>
				{t('editor_page.test')}
			  </Button>
			)}
			<Button variant="secondary" size="sm" onClick={handleSave} loading={saving} disabled={!adminMode && isPublished}>
			  {saveLabel}
			</Button>
			{!adminMode && (
			  <Button
				variant="primary"
				size="sm"
				onClick={handlePublishClick}
				loading={publishing}
				disabled={!mapId || !creatorCompleted || isPublished}
				title={
				  isPublished ? t('editor_page.tooltip_published'):
				  !creatorCompleted ? t('editor_page.tooltip_test_first') :
				  undefined
				}
			  >
				{isPublished ? t('editor_page.published') : t('editor_page.publish')}
			  </Button>
			)}
			{!adminMode && isPublished && (
			  <Button 
			  variant="ghost" 
			  size="sm" 
			  onClick={handleUnpublish} 
			  loading={unpublishing}>
				🔓 {t('editor_page.unpublish')}
			  </Button>
			)}
		  </div>
		</div>

		<div className="flex gap-6">
		  {/* LEFT PANEL */}
		<div className="flex flex-col gap-5 w-44 shrink-0">
			{/* Tiles + nom map etc */}
			<Input
			  label={adminMode ? t('editor_page.level_name_label') : t('editor_page.map_name_label')}
			  value={mapName}
			  onChange={(e) => { setMapName(e.target.value); setHasUnsavedChanges(true); }}
			  placeholder={adminMode ? t('editor_page.level_name_placeholder') : t('editor_page.map_name_placeholder')}
			  maxLength={50}
			  disabled={adminMode}
			/>
			<TileSelector selected={selectedTile} onChange={setSelectedTile} />
		  </div>

		  {/* CENTER = GRID */}
		<div className="flex-1 flex justify-center">
			{/* GRID */}
			<EditorGrid
			  grid={grid}
			  selectedTile={selectedTile}
			  onTileClick={(!adminMode && isPublished) ? () => {} : setTile}
			  onTileRightClick={(!adminMode && isPublished) ? undefined : clearTile}
			/>
		  </div>

		  <div className="flex flex-col gap-5 w-72 shrink-0">

		{/* SETTINGS */}
		<MapSettingsPanel
			settings={settings}
			onChange={setSettings}
		/>

		{/* MES MAPS */}
		{!adminMode && (
			<div className="bg-[#111] border border-[#444] rounded-lg p-4 flex flex-col gap-2">
			
			<p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">
				{t('editor_page.my_maps')}
			</p>

			{loadingMyMaps ? (
				<div className="flex justify-center pt-4">
				<Spinner size="sm" className="text-deep-400" />
				</div>
			) : myMaps.length === 0 ? (
				<p className="text-white/30 text-xs">
				{t('editor_page.no_saved_maps')}
				</p>
			) : (
				myMaps.map((m) => (
				<div
					key={m.id}
					className={[
					'flex items-center justify-between gap-2 px-3 py-2 rounded border text-sm transition-colors',
					m.id === mapId
						? 'bg-deep-500 border-deep-300 text-white'
						: 'bg-surface-raised border-surface-border text-white/70 hover:text-white',
					].join(' ')}
				>
					<button
					className="flex-1 text-left truncate min-w-0"
					onClick={() => handleLoadMap(m)}
					>
					<span className="block truncate font-medium">{m.name}</span>
					</button>

					<Button
					variant="danger"
					size="sm"
					onClick={() => {
						setMapToDelete(m.id);
						setShowDeleteModal(true);
					}}
					>
					{t('editor_page.delete')}
					</Button>
				</div>
				))
			)}

			<Button
				variant="ghost"
				size="sm"
				onClick={() => {
				setGrid(makeEmptyGrid());
				setMapName('');
				setMapId(null);
				setIsPublished(false);
				setCreatorCompleted(false);
				setHasUnsavedChanges(false);
				navigate('/editor', { replace: true });
				}}
			>
				{t('editor_page.create_new_map')}
			</Button>

			</div>
		)}

		</div>

		  {/* Admin right panel */}
		  {adminMode && (
			<div className="flex flex-col gap-2 w-40 shrink-0">
			  <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-1">
				{t('editor_page.tower_levels')}
			  </p>
			  {loadingAdminLevels ? (
				<div className="flex justify-center pt-4">
				  <Spinner size="sm" className="text-deep-400" />
				</div>
			  ) : (
				Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
				  const level = adminLevels.find((l) => l.order_index === n);
				  const isSelected = selectedLevel === n;
				  return (
					<button
					  key={n}
					  onClick={() => {
						if (level) {
						  handleSelectAdminLevel(level);
						} else {
						  setSelectedLevel(n);
						  setGrid(makeEmptyGrid());
						  setMapName(t('tower_levels.level_' + n));
						}
					  }}
					  className={[
						'px-3 py-2 rounded text-sm font-medium text-left transition-colors w-full min-w-0',
						isSelected
						  ? 'bg-deep-500 text-white ring-1 ring-deep-300'
						  : 'bg-surface-raised text-white/70 hover:bg-surface-muted border border-surface-border',
					  ].join(' ')}
					>
					  <span className="font-bold">{n}.</span>{' '}
					  <span className="truncate block">{t('tower_levels.level_' + n)}</span>
					</button>
				  );
				})
			  )}
			</div>
		  )}
		</div>
	  </div>

	  <Modal
		isOpen={showPublishModal}
		onClose={() => setShowPublishModal(false)}
		title={t('editor_page.publish_modal_title')}
	  >
		<p className="text-white/70 text-sm mb-5">
		  {t('editor_page.publish_modal_body')}
		</p>
		<div className="flex gap-3 justify-end">
		  <Button variant="secondary" onClick={() => setShowPublishModal(false)}>
			{t('editor_page.cancel')}
		  </Button>
		  <Button onClick={handlePublish} loading={publishing}>
			{t('editor_page.confirm')}
		  </Button>
		</div>
	  </Modal>

	  <Modal
		isOpen={showDeleteModal}
		onClose={() => setShowDeleteModal(false)}
		title={t('editor_page.delete_map')}
	  >
		<p className="text-white/70 text-sm mb-5">
		  {t('editor_page.warning')}
		</p>
		<div className="flex gap-3 justify-end">
		  <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
			{t('editor_page.cancel')}
		  </Button>
		  <Button variant="primary" onClick={handleDeleteConfirm} loading={deleting}>
			{t('editor_page.delete')}
		  </Button>
		</div>
	  </Modal>

	  <Modal
		isOpen={showUnsavedTestModal}
		onClose={() => setShowUnsavedTestModal(false)}
		title={t('editor_page.unsaved_changes_title')}
	  >
		<p className="text-white/70 text-sm mb-5">
		  {t('editor_page.unsaved_changes_body')}
		</p>
		<div className="flex gap-3 justify-end">
		  <Button variant="secondary" onClick={() => setShowUnsavedTestModal(false)}>
			{t('editor_page.cancel')}
		  </Button>
		  <Button onClick={handleSaveAndTest} loading={saving}>
			{t('editor_page.save_and_test')}
		  </Button>
		</div>
	  </Modal>
	</Layout>
  );
}
