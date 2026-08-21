/**
 * Integration test: the error toast is visible on LoginPage.
 * Does NOT mock useToast — verifies that the toast message is actually rendered
 * in the DOM, proving that <ToastContainer> is mounted at App level (App.tsx),
 * not only inside <Layout> where LoginPage never reaches it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/useToast';
import { ToastContainer } from '@/components/ui/Toast';

// ── vi.hoisted ──────────────────────────────────────────────────────────────

const mockLogin = vi.hoisted(() => vi.fn());

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/context/auth.context', () => ({
	useAuth: () => ({ user: null, login: mockLogin, loading: false }),
}));

// ── Component under test ─────────────────────────────────────────────────────

import { LoginPage } from '@/pages/auth/LoginPage';

// ── Helper matching App.tsx structure after fix ───────────────────────────────

function renderWithRealToast() {
	return render(
		<ToastProvider>
			<MemoryRouter initialEntries={['/login']}>
				<LoginPage />
			</MemoryRouter>
			<ToastContainer />
		</ToastProvider>,
	);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage — toast visible (integration with real ToastContainer)', () => {
	beforeEach(() => {
		mockLogin.mockReset();
	});

	it('renders error toast in the DOM when login returns 400 Invalid email', async () => {
		mockLogin.mockRejectedValueOnce({ error: 'Invalid email' });

		renderWithRealToast();

		await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
		await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret');
		await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
		});
	});

	it('renders error toast when credentials are invalid (401)', async () => {
		mockLogin.mockRejectedValueOnce({ error: 'Invalid credentials' });

		renderWithRealToast();

		await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
		await userEvent.type(screen.getByLabelText(/mot de passe/i), 'wrong');
		await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
		});
	});

	it('renders fallback message when the error has no .error field (network failure)', async () => {
		mockLogin.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		renderWithRealToast();

		await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
		await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret');
		await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('Échec de la connexion');
		});
	});
});
