
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@ft/shared';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTranslation } from 'react-i18next';

export function RegisterPage() {
	const { user, register, loading: authLoading } = useAuth();
	const { showToast } = useToast();

	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { t } = useTranslation();

	if (authLoading)
		return (
			<div className="min-h-screen bg-surface flex items-center justify-center">
				<Spinner size="lg" className="text-deep-400" />
			</div>
		);
	if (user) return <Navigate to="/" replace />;

	const validate = (): boolean => {
		const next: Record<string, string> = {};

		if (!/^[a-zA-Z0-9]{3,20}$/.test(username))
			next.username = t('register_page.validation_username');
		if (!email.includes('@'))
			next.email = t('register_page.validation_email');
		if (password.length < 8)
			next.password = t('register_page.validation_password');
		if (password !== confirm)
			next.confirm = t('register_page.validation_confirm_password');

		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setLoading(true);
		try {
			await register(username, email, password);
		} catch (err) {
			const msg = (err as ApiError).error ?? t('register_page.register_error');
			showToast(msg, 'error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-surface flex items-center justify-center p-4">
			{/* Language selector */}
			<div className="absolute top-4 right-4">
				<LanguageSelector />
			</div>
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="font-fantasy text-deep-300 text-3xl tracking-widest mb-2">
						Guilds of the Deep
					</h1>
					<p className="text-white/50 text-sm">
						{t('register_page.adventure')}
					</p>
				</div>

				<div className="bg-surface-raised border border-surface-border rounded-xl p-8 shadow-lg">
					<h2 className="text-xl font-semibold text-white mb-6">
						{t('common.register')}
					</h2>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
						<Input
							label={t('register_page.mail_label')}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="HeroOfTheDeep"
							error={errors.username}
							autoComplete="username"
						/>
						<Input
							label="Email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t('common.mail_placeholder')}
							error={errors.email}
							autoComplete="email"
						/>
						<Input
							label={t('common.password')}
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							error={errors.password}
							autoComplete="new-password"
						/>
						<Input
							label={t('register_page.confirm_password')}
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="••••••••"
							error={errors.confirm}
							autoComplete="new-password"
						/>
						<Button type="submit" loading={loading} className="w-full mt-2">
							{t('register_page.create')}
						</Button>
					</form>

					<p className="mt-5 text-center text-sm text-white/50">
						{t('register_page.is_registered')}{' '}
						<Link
							to="/login"
							className="text-deep-300 hover:text-deep-200 transition-colors font-medium"
						>
							{t('common.connect')}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
