import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MapData } from '@ft/shared';
import { TILE, GRID_SIZE } from '@ft/shared';

// ── vi.hoisted: declare mock functions BEFORE vi.mock factories run ─────────

const mockGetById = vi.hoisted(() => vi.fn());

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
  useAuth: () => ({
    user: { id: 'u1', username: 'alice' },
    logout: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/services/api.service', () => ({
  api: {
    maps: {
      getById: mockGetById,
      create: vi.fn(),
      update: vi.fn(),
      publish: vi.fn(),
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('EditorPage — publish button state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
