import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";

const SIZE = 25;
const EMPTY = 0;
const WALL = 1;
const EXIT = 2;
const SPAWN = 3;
const ENEMY_START = 4;
const ENEMY_V_START = 5;

const TICK = 400;

const EMPTY_GRID = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(EMPTY));

function cellClass(cell, isPlayer, isEnemy) {
  if (isPlayer) return "cell cell-player";
  if (isEnemy)  return "cell cell-enemy";
  if (cell === EXIT)          return "cell cell-exit";
  if (cell === WALL)          return "cell cell-wall";
  if (cell === SPAWN)         return "cell cell-spawn";
  if (cell === ENEMY_START)   return "cell cell-enemy-start";
  if (cell === ENEMY_V_START) return "cell cell-enemy-v-start";
  return "cell cell-empty";
}

export default function MapEditor({ user }) {
  const [grid, setGrid]         = useState(EMPTY_GRID());
  const [mapId, setMapId]       = useState(null);
  const [mapName, setMapName]   = useState("My World");
  const [tool, setTool]         = useState(WALL);
  const [tab, setTab]           = useState("editor");
  const [publicMaps, setPublicMaps] = useState([]);
  const [status, setStatus]     = useState(null);

  // play state
  const [playGrid, setPlayGrid] = useState(EMPTY_GRID());
  const [player, setPlayer]     = useState({ x: 0, y: 0 });
  const [enemies, setEnemies]   = useState([]);
  const [won, setWon]               = useState(false);
  const [gameOver, setGameOver]     = useState(false);
  const [mapCompleted, setMapCompleted] = useState(false);
  const [playingOwnMap, setPlayingOwnMap] = useState(false);

  // editor drag
  const [painting, setPainting]     = useState(false);
  const [paintValue, setPaintValue] = useState(WALL);

  // stable refs for interval/callback closures
  const enemiesRef       = useRef(enemies);
  const playerRef        = useRef(player);
  const mapIdRef         = useRef(mapId);
  const playingOwnMapRef = useRef(false);
  useEffect(() => { enemiesRef.current       = enemies;       }, [enemies]);
  useEffect(() => { playerRef.current        = player;        }, [player]);
  useEffect(() => { mapIdRef.current         = mapId;         }, [mapId]);
  useEffect(() => { playingOwnMapRef.current = playingOwnMap; }, [playingOwnMap]);

  // ── Load own map on mount ──────────────────────────────────────────────
  useEffect(() => {
    api.getMyMaps().then((maps) => {
      if (maps.length > 0) {
        const m = maps[0];
        setMapId(m.id);
        setMapName(m.name);
        setGrid(JSON.parse(m.grid));
        setMapCompleted(!!m.creator_completed);
      }
    });
  }, []);

  // ── Tab switch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === "explore") api.getPublicMaps().then(setPublicMaps);
    if (tab === "play")    { setPlayingOwnMap(true); initPlay(grid); }
  }, [tab]);

  function initPlay(sourceGrid, ownMap = true) {
    let spawnX = 0, spawnY = 0;
    const initEnemies = [];
    const base = sourceGrid.map((row, y) =>
      row.map((cell, x) => {
        if (cell === SPAWN)         { spawnX = x; spawnY = y; return EMPTY; }
        if (cell === ENEMY_START)   { initEnemies.push({ x, y, dir: 1, axis: "x" }); return EMPTY; }
        if (cell === ENEMY_V_START) { initEnemies.push({ x, y, dir: 1, axis: "y" }); return EMPTY; }
        return cell;
      })
    );
    setPlayGrid(base);
    setPlayer({ x: spawnX, y: spawnY });
    setEnemies(initEnemies);
    setPlayingOwnMap(ownMap);
    setWon(false);
    setGameOver(false);
  }

  // ── Enemy tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "play" || won || gameOver) return;
    const id = setInterval(() => {
      setEnemies((prev) => {
        const next = prev.map((e) => {
          if (e.axis === "x") {
            const nx = e.x + e.dir;
            const blocked =
              nx < 0 || nx >= SIZE ||
              playGrid[e.y][nx] === WALL ||
              prev.some((o) => o !== e && o.x === nx && o.y === e.y);
            if (blocked) return { ...e, dir: -e.dir };
            return { ...e, x: nx };
          } else {
            const ny = e.y + e.dir;
            const blocked =
              ny < 0 || ny >= SIZE ||
              playGrid[ny][e.x] === WALL ||
              prev.some((o) => o !== e && o.x === e.x && o.y === ny);
            if (blocked) return { ...e, dir: -e.dir };
            return { ...e, y: ny };
          }
        });
        if (next.some((e) => e.x === playerRef.current.x && e.y === playerRef.current.y)) {
          setGameOver(true);
        }
        return next;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [tab, won, gameOver, playGrid]);

  // ── Player movement ────────────────────────────────────────────────────
  const move = useCallback((dx, dy) => {
    const p = playerRef.current;
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) return;
    if (playGrid[ny][nx] === WALL) return;

    setPlayer({ x: nx, y: ny });

    if (enemiesRef.current.some((e) => e.x === nx && e.y === ny)) {
      setGameOver(true);
      return;
    }

    if (playGrid[ny][nx] === EXIT) {
      setWon(true);
      if (playingOwnMapRef.current && mapIdRef.current) {
        api.completeMap(mapIdRef.current)
          .then(() => setMapCompleted(true))
          .catch((e) => setStatus("Error: " + e.message));
      }
    }
  }, [playGrid]);

  useEffect(() => {
    if (tab !== "play" || won || gameOver) return;
    const handle = (e) => {
      if (e.key === "ArrowUp")    { e.preventDefault(); move(0, -1); }
      if (e.key === "ArrowDown")  { e.preventDefault(); move(0,  1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); move(-1, 0); }
      if (e.key === "ArrowRight") { e.preventDefault(); move( 1, 0); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [tab, move, won, gameOver]);

  // ── Editor paint ───────────────────────────────────────────────────────
  const applyPaint = useCallback((x, y, value) => {
    setGrid((prev) => {
      if (prev[y][x] === value) return prev;
      const next = prev.map((row) => [...row]);
      if (value === EXIT || value === SPAWN) {
        for (let ry = 0; ry < SIZE; ry++)
          for (let rx = 0; rx < SIZE; rx++)
            if (next[ry][rx] === value) next[ry][rx] = EMPTY;
      }
      next[y][x] = value;
      return next;
    });
  }, []);

  const startPaint = (x, y) => {
    const value = grid[y][x] === tool ? EMPTY : tool;
    setPainting(true);
    setPaintValue(value);
    applyPaint(x, y, value);
  };

  const continuePaint = (x, y) => { if (painting) applyPaint(x, y, paintValue); };
  const stopPaint = () => setPainting(false);

  // ── Validation ─────────────────────────────────────────────────────────
  const hasExit  = () => grid.some((row) => row.includes(EXIT));
  const hasSpawn = () => grid.some((row) => row.includes(SPAWN));

  const save = async () => {
    if (!hasSpawn()) { setStatus("Place a spawn point (blue) first."); return; }
    if (!hasExit())  { setStatus("Place an exit (green) first."); return; }
    try {
      if (mapId) {
        await api.updateMap(mapId, grid, mapName);
      } else {
        const m = await api.createMap(grid, mapName);
        setMapId(m.id);
      }
      setStatus("Saved.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const publish = async () => {
    if (!mapId)         { setStatus("Save first."); return; }
    if (!hasSpawn())    { setStatus("Place a spawn point first."); return; }
    if (!hasExit())     { setStatus("Place an exit first."); return; }
    if (!mapCompleted)  { setStatus("Complete your own map before publishing."); return; }
    try {
      await api.publishMap(mapId);
      setStatus("Published!");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const loadPublicMap = async (id) => {
    const m = await api.getMap(id);
    setGrid(m.grid);
    initPlay(m.grid, false);
    setTab("play");
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const renderGrid = (editable) => {
    const source = editable ? grid : playGrid;
    return source.map((row, y) =>
      row.map((cell, x) => {
        const isPlayer = !editable && player.x === x && player.y === y;
        const isEnemy  = !editable && enemies.some((e) => e.x === x && e.y === y);
        return (
          <div
            key={`${x}-${y}`}
            className={cellClass(cell, isPlayer, isEnemy)}
            onMouseDown={editable ? () => startPaint(x, y) : undefined}
            onMouseEnter={editable ? () => continuePaint(x, y) : undefined}
          />
        );
      })
    );
  };

  const TOOLS = [
    { value: WALL,          label: "Wall" },
    { value: SPAWN,         label: "Spawn" },
    { value: EXIT,          label: "Exit" },
    { value: ENEMY_START,   label: "Enemy H" },
    { value: ENEMY_V_START, label: "Enemy V" },
    { value: EMPTY,         label: "Erase" },
  ];

  return (
    <div className="game-container">
      <header className="game-header">
        <span className="game-title">Transcendence</span>
        <nav>
          {["editor", "play", "explore"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "active" : ""}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <span className="game-user">{user.username}</span>
      </header>

      {tab === "editor" && (
        <div className="panel">
          <div className="map-controls">
            <input value={mapName} onChange={(e) => setMapName(e.target.value)} className="map-name-input" />
            <button onClick={save}>Save</button>
            <button onClick={publish}>Publish</button>
            <button onClick={() => { setGrid(EMPTY_GRID()); setMapId(null); setStatus(null); }}>New</button>
          </div>
          <div className="tool-selector">
            {TOOLS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTool(t.value)}
                className={`tool-btn tool-${t.label.toLowerCase()}${tool === t.value ? " active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {status && <p className="status-msg">{status}</p>}
          {mapId && (
            <p className={mapCompleted ? "badge badge-done" : "badge badge-pending"}>
              {mapCompleted ? "Completed — can publish" : "Not completed yet — play your map to unlock publishing"}
            </p>
          )}
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${SIZE}, 24px)` }}
            onMouseLeave={stopPaint}
            onMouseUp={stopPaint}
          >
            {renderGrid(true)}
          </div>
          <p className="hint">Spawn (blue) · Exit (green) · Enemy H (orange) · Enemy V (purple)</p>
        </div>
      )}

      {tab === "play" && (
        <div className="panel">
          {gameOver ? (
            <div className="victory gameover">
              <h2>Game Over</h2>
              <button onClick={() => initPlay(grid)}>Retry</button>
              <button onClick={() => setTab("explore")}>Back to worlds</button>
            </div>
          ) : won ? (
            <div className="victory">
              <h2>You reached the exit!</h2>
              <button onClick={() => initPlay(grid)}>Retry</button>
              <button onClick={() => setTab("explore")}>Back to worlds</button>
            </div>
          ) : (
            <>
              <p className="hint">Arrow keys · reach the green exit · avoid enemies</p>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 24px)` }}>
                {renderGrid(false)}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "explore" && (
        <div className="panel">
          <h3>Public worlds</h3>
          {publicMaps.length === 0 && <p>No published worlds yet.</p>}
          <ul className="map-list">
            {publicMaps.map((m) => (
              <li key={m.id}>
                <span>{m.name}</span>
                <button onClick={() => loadPublicMap(m.id)}>Play</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
