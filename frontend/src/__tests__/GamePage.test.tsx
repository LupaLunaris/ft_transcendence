import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { MapData } from '@ft/shared';

// ── vi.hoisted: declare mock functions BEFORE vi.mock factories run ─────────

const mockNavigate    = vi.hoisted(() => vi.fn());
const mockSubmit      = vi.hoisted(() => vi.fn());
const mockMarkComplete = vi.hoisted(() => vi.fn());

// Mutable containers for per-test map/user state
const mapRef  = vi.hoisted(() => ({ current: null as MapData | null }));
const userRef = vi.hoisted(() => ({ current: { id: 'user-creator', username: 'alice' } as { id: string; username: string } | null }));

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/game/GameCanvas', () => ({
  GameCanvas: ({ onExit }: { onExit: (ms: number) => void }) => (
    <button data-testid="finish" onClick={() => onExit(1500)}>finish</button>
  ),
}));

vi.mock('@/components/ui/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/context/auth.context', () => ({
  useAuth: () => ({ user: userRef.current, logout: vi.fn(), loading: false }),
}));

vi.mock('@/services/api.service', () => ({
  api: {
    scores: { submit: mockSubmit },
    maps: { markComplete: mockMarkComplete },
  },
}));

vi.mock('@/hooks/useMap', () => ({
  useMap: () => ({ map: mapRef.current, loading: false, error: null }),
}));

// ── Component under test ────────────────────────────────────────────────────
import { GamePage } from '@/pages/game/GamePage';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMap(overrides: Partial<MapData> = {}): MapData {
  return {
    id: 'map-1',
    name: 'Test Map',
    grid: [] as any,
    creator_id: 'user-creator',
    published: false,
    creator_completed: false,
    difficulty: 'easy',
    play_count: 0,
    created_at: '',
    ...overrides,
  };
}

function renderGame(mapId = 'map-1') {
  return render(
    <MemoryRouter initialEntries={[`/play/${mapId}`]}>
      <Routes>
        <Route path="/play/:map_id" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GamePage — handleExit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit.mockResolvedValue({});
    mockMarkComplete.mockResolvedValue({});
    userRef.current = { id: 'user-creator', username: 'alice' };
    mapRef.current  = makeMap();
  });

  it('always submits the score on completion', async () => {
    renderGame('map-1');
    await userEvent.click(screen.getByTestId('finish'));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith('map-1', 1500));
  });

  it('calls markComplete and navigates to /editor/:id when the creator finishes', async () => {
    userRef.current = { id: 'user-creator', username: 'alice' };
    mapRef.current  = makeMap({ creator_id: 'user-creator' });

    renderGame('map-1');
    await userEvent.click(screen.getByTestId('finish'));

    await waitFor(() => expect(mockMarkComplete).toHaveBeenCalledWith('map-1'));
    expect(mockNavigate).toHaveBeenCalledWith('/editor/map-1');
    expect(mockNavigate).not.toHaveBeenCalledWith('/train');
  });

  it('does NOT call markComplete and navigates to /train when a non-creator finishes', async () => {
    userRef.current = { id: 'other-user', username: 'bob' };
    mapRef.current  = makeMap({ creator_id: 'user-creator' });

    renderGame('map-1');
    await userEvent.click(screen.getByTestId('finish'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/train'));
    expect(mockMarkComplete).not.toHaveBeenCalled();
  });

  it('still navigates to editor even when markComplete rejects (already completed)', async () => {
    mockMarkComplete.mockRejectedValue(new Error('already done'));
    userRef.current = { id: 'user-creator', username: 'alice' };
    mapRef.current  = makeMap({ creator_id: 'user-creator' });

    renderGame('map-1');
    await userEvent.click(screen.getByTestId('finish'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/editor/map-1'));
  });
});
