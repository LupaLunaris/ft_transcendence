import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MapData } from '@ft/shared';
import { TILE, GRID_SIZE } from '@ft/shared';

// ── vi.hoisted: declare mock functions BEFORE vi.mock factories run ─────────

const mockGetById = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());
const mockGetTowerLevels = vi.hoisted(() => vi.fn());
const mockUpdateTowerLevel = vi.hoisted(() => vi.fn());

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/components/ui/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// Stub Layout so ToastContainer (which needs a ToastProvider) is never rendered
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: any }) => children,
}));

vi.mock('@/context/auth.context', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/services/api.service', () => ({
  api: {
    maps: {
      getById: mockGetById,
      create: vi.fn(),
      update: vi.fn(),
      publish: vi.fn(),
    },
    admin: {
      getTowerLevels: mockGetTowerLevels,
      updateTowerLevel: mockUpdateTowerLevel,
    },
  },
}));

// ── Component under test ────────────────────────────────────────────────────
import { EditorPage } from '@/pages/editor/EditorPage';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => TILE.EMPTY),
  );
}

function makeMap(overrides: Partial<MapData> = {}): MapData {
  return {
    id: 'map-1',
    name: 'My Dungeon',
    grid: makeGrid() as any,
    creator_id: 'u1',
    published: false,
    creator_completed: false,
    difficulty: 'easy',
    play_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderEditor(mapId = 'map-1') {
  return render(
    <MemoryRouter initialEntries={[`/editor/${mapId}`]}>
      <Routes>
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditorNew() {
  return render(
    <MemoryRouter initialEntries={['/editor']}>
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function makeAdminGrid() {
  return Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (__, c) =>
      r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1 ? TILE.WALL : TILE.EMPTY,
    ),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('EditorPage — publish button state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'alice', is_admin: false },
      logout: vi.fn(),
      loading: false,
    });
  });

  it('disables publish when creator_completed is false', async () => {
    mockGetById.mockResolvedValue(makeMap({ creator_completed: false, published: false }));
    renderEditor();

    const btn = await screen.findByRole('button', { name: /publier/i });
    await waitFor(() => expect(btn).toBeDisabled());
  });

  it('enables publish when creator_completed is true and not yet published', async () => {
    mockGetById.mockResolvedValue(makeMap({ creator_completed: true, published: false }));
    renderEditor();

    const btn = await screen.findByRole('button', { name: /publier/i });
    await waitFor(() => expect(btn).toBeEnabled());
  });

  it('disables publish and shows "Publiée" label when map is already published', async () => {
    mockGetById.mockResolvedValue(makeMap({ creator_completed: true, published: true }));
    renderEditor();

    const btn = await screen.findByRole('button', { name: /publiée/i });
    await waitFor(() => expect(btn).toBeDisabled());
  });

  it('disables save button when map is published', async () => {
    mockGetById.mockResolvedValue(makeMap({ creator_completed: true, published: true }));
    renderEditor();

    const saveBtn = await screen.findByRole('button', { name: /sauvegarder/i });
    await waitFor(() => expect(saveBtn).toBeDisabled());
  });

  it('loads map name from API into the input', async () => {
    mockGetById.mockResolvedValue(makeMap({ name: 'Mon Donjon Épique' }));
    renderEditor();

    await waitFor(() =>
      expect(screen.getByDisplayValue('Mon Donjon Épique')).toBeInTheDocument(),
    );
  });
});

// ── Admin mode tests ───────────────────────────────────────────────────────

describe('EditorPage — admin mode', () => {
  const adminLevels = [
    { id: 'l1', order_index: 1, name: 'Les Catacombes', grid_json: makeAdminGrid() },
    { id: 'l3', order_index: 3, name: 'Salle du Trône', grid_json: makeAdminGrid() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'alice', is_admin: true },
      logout: vi.fn(),
      loading: false,
    });
    mockGetTowerLevels.mockResolvedValue(adminLevels);
  });

  it('auto-activates admin mode and calls getTowerLevels without manual toggle', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalledTimes(1));
  });

  it('renders all 8 level buttons in the admin panel', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    for (let n = 1; n <= 8; n++) {
      expect(await screen.findByText(new RegExp(`${n}\\.`))).toBeInTheDocument();
    }
  });

  it('shows known level names from API on the buttons', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    expect(await screen.findByText(/Les Catacombes/)).toBeInTheDocument();
    expect(await screen.findByText(/Salle du Trône/)).toBeInTheDocument();
  });

  it('shows fallback "Niveau N" for levels not yet seeded by admin', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    // Level 2 is absent from the mock response
    expect(await screen.findByText(/Niveau 2/)).toBeInTheDocument();
  });

  it('loads the level name into the input when clicking a known level button', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    const btn = await screen.findByText(/Les Catacombes/);
    fireEvent.click(btn.closest('button')!);

    await waitFor(() =>
      expect(screen.getByLabelText('Nom du niveau')).toHaveValue('Les Catacombes'),
    );
  });

  it('calls updateTowerLevel with correct args when saving a selected level', async () => {
    mockUpdateTowerLevel.mockResolvedValue({ ...adminLevels[0] });
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    // Select level 1
    const btn = await screen.findByText(/Les Catacombes/);
    fireEvent.click(btn.closest('button')!);

    // Click save
    const saveBtn = await screen.findByRole('button', { name: /sauvegarder niveau 1/i });
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(mockUpdateTowerLevel).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Les Catacombes', grid_json: expect.any(String) }),
      ),
    );
  });

  it('does not call updateTowerLevel when no level is selected', async () => {
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    const saveBtn = await screen.findByRole('button', { name: /💾 Sauvegarder$/ });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(mockUpdateTowerLevel).not.toHaveBeenCalled());
  });

  it('adds a newly created level to the button list after saving', async () => {
    const newLevel = { id: 'l2', order_index: 2, name: 'Niveau 2', grid_json: makeAdminGrid() };
    mockUpdateTowerLevel.mockResolvedValue(newLevel);
    renderEditorNew();

    await waitFor(() => expect(mockGetTowerLevels).toHaveBeenCalled());

    // Select level 2 (not yet in DB)
    const btn2 = await screen.findByText(/Niveau 2/);
    fireEvent.click(btn2.closest('button')!);

    // Save
    const saveBtn = await screen.findByRole('button', { name: /sauvegarder niveau 2/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(mockUpdateTowerLevel).toHaveBeenCalledWith(2, expect.any(Object)));
  });
});
