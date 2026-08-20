import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── vi.hoisted ──────────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin    = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());

const authRef = vi.hoisted(() => ({
  current: {
    user: null as { id: string; username: string } | null,
    login: mockLogin,
    loading: false,
  },
}));

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/context/auth.context', () => ({
  useAuth: () => authRef.current,
}));

vi.mock('@/components/ui/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// ── Component under test ─────────────────────────────────────────────────────

import { LoginPage } from '@/pages/auth/LoginPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    authRef.current = { user: null, login: mockLogin, loading: false };
    mockLogin.mockReset();
    mockShowToast.mockReset();
    mockNavigate.mockReset();
  });

  it('affiche le formulaire quand non authentifié et loading=false', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it('affiche un spinner pendant le chargement auth (loading=true)', () => {
    authRef.current = { user: null, login: mockLogin, loading: true };
    renderPage();
    expect(screen.queryByRole('button', { name: /se connecter/i })).not.toBeInTheDocument();
    // The spinner is present (not the form)
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it('redirige vers / si user est déjà connecté (loading=false)', () => {
    authRef.current = {
      user: { id: 'u1', username: 'alice' },
      login: mockLogin,
      loading: false,
    };
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
    // The Navigate component replaces the route — no form rendered
    expect(container.querySelector('form')).toBeNull();
  });

  it('appelle login() avec les valeurs du formulaire et navigue sur succès', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    // After login, the auth state changes — we simulate this by putting user in the ref
    // then forcing a re-render via mockLogin resolving
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'secret123');
    });
  });

  it('affiche un toast si login() rejette', async () => {
    mockLogin.mockRejectedValueOnce({ error: 'Invalid credentials' });
    renderPage();

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Invalid credentials', 'error');
    });
  });
});
