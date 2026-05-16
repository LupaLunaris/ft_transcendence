/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* EditorPage.tsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TILE, GRID_SIZE, type Grid, type TileValue } from '@ft/shared';
import { api } from '@/services/api.service';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Layout } from '@/components/layout/Layout';
import { EditorGrid } from '@/components/editor/EditorGrid';
import { TileSelector } from '@/components/editor/TileSelector';

function makeEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (__, col) => {
      if (row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1)
        return TILE.WALL;
      return TILE.EMPTY;
    }),
  ) as Grid;
}

export function EditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [grid, setGrid] = useState<Grid>(makeEmptyGrid);
  const [selectedTile, setSelectedTile] = useState<TileValue>(TILE.WALL);
  const [mapName, setMapName] = useState('');
  const [mapId, setMapId] = useState<string | null>(id ?? null);
  const [creatorCompleted, setCreatorCompleted] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [loadingMap, setLoadingMap] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

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
      })
      .catch(() => showToast('Impossible de charger la map', 'error'))
      .finally(() => setLoadingMap(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setTile = useCallback((x: number, y: number) => {
    // Borders are always WALL — protect them in the editor
    if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) return;
    setGrid((prev) => {
      const next = prev.map((row) => [...row]) as Grid;
      next[y][x] = selectedTile;
      return next;
    });
  }, [selectedTile]);

  const handleSave = async () => {
    if (!mapName.trim()) {
      showToast('Donne un nom à ta map', 'error');
      return;
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
      showToast('Map sauvegardée !', 'success');
    } catch (err) {
      const msg = err && typeof err === 'object' && 'error' in err
        ? String((err as { error: string }).error)
        : 'Erreur lors de la sauvegarde';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!mapId) {
      showToast('Sauvegarde d\'abord ta map', 'error');
      return;
    }
    setPublishing(true);
    setShowPublishModal(false);
    try {
      await api.maps.publish(mapId);
      setIsPublished(true);
      showToast('Map publiée ! Elle est désormais accessible dans S\'entraîner.', 'success');
    } catch (err) {
      const msg = err && typeof err === 'object' && 'error' in err
        ? String((err as { error: string }).error)
        : 'Erreur lors de la publication';
      showToast(msg, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleTest = () => {
    if (!mapId) {
      showToast('Sauvegarde d\'abord ta map', 'error');
      return;
    }
    navigate(`/play/${mapId}`);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-semibold font-fantasy text-white tracking-wide flex items-center gap-3">
            {mapId ? (isPublished ? 'Map publiée' : 'Modifier la map') : 'Nouvelle map'}
            {isPublished && (
              <span className="text-xs font-sans font-medium bg-deep-600 text-deep-200 px-2 py-0.5 rounded-full">
                ✓ publiée
              </span>
            )}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleTest} disabled={!mapId || isPublished}>
              🎮 Tester
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} loading={saving} disabled={isPublished}>
              💾 Sauvegarder
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPublishModal(true)}
              loading={publishing}
              disabled={!mapId || !creatorCompleted || isPublished}
              title={
                isPublished ? 'Map déjà publiée' :
                !creatorCompleted ? 'Teste ta map d\'abord pour pouvoir la publier' :
                undefined
              }
            >
              🚀 {isPublished ? 'Publiée' : 'Publier'}
            </Button>
          </div>
        </div>

        <div className="flex gap-6 flex-wrap">
          {/* Left panel: tile selector + name */}
          <div className="flex flex-col gap-5 w-44 shrink-0">
            <Input
              label="Nom de la map"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Mon donjon"
              maxLength={50}
            />
            <TileSelector selected={selectedTile} onChange={setSelectedTile} />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <EditorGrid
              grid={grid}
              selectedTile={selectedTile}
              onTileClick={isPublished ? () => {} : setTile}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publier la map ?"
      >
        <p className="text-white/70 text-sm mb-5">
          Tu dois avoir terminé ta propre map avant de la publier. Une fois publiée, elle ne
          pourra plus être modifiée.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowPublishModal(false)}>
            Annuler
          </Button>
          <Button onClick={handlePublish} loading={publishing}>
            Confirmer
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
