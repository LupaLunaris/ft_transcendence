// Manages the authenticated user, JWT session state, and auth actions for React components.
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';
import type { UserPublic } from '@ft/shared';
import { api } from '@/services/api.service';

const TOKEN_KEY = 'ft_token';

interface AuthContextValue {
	user: UserPublic | null;
	token: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (username: string, email: string, password: string) => Promise<void>;
	logout: () => void;
	updateUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Provides the global authentication state and actions to the entire application.
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserPublic | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// restore session from localStorage
	useEffect(() => {
		const stored = localStorage.getItem(TOKEN_KEY);
		if (!stored) {
			setLoading(false);
			return;
		}

		setToken(stored);

		api.auth
			.getMe()
			.then((me) => setUser(me))
			.catch(() => {
				localStorage.removeItem(TOKEN_KEY);
				setToken(null);
			})
			.finally(() => setLoading(false));
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const { user: me, token: jwt } = await api.auth.login({ identifier: email, password });
		localStorage.setItem(TOKEN_KEY, jwt);
		setToken(jwt);
		setUser(me);
	}, []);

	const register = useCallback(
		async (username: string, email: string, password: string) => {
			const { user: me, token: jwt } = await api.auth.register({
				username,
				email,
				password,
			});
			localStorage.setItem(TOKEN_KEY, jwt);
			setToken(jwt);
			setUser(me);
		},
		[],
	);

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY);
		setToken(null);
		setUser(null);
	}, []);

	const updateUser = useCallback((updated: UserPublic) => {
		setUser(updated);
	}, []);

	return (
		<AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
			{children}
		</AuthContext.Provider>
	);
}

// Returns the authentication context for any component inside AuthProvider.
export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
	return ctx;
}
