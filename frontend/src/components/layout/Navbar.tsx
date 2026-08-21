
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Avatar } from '@/components/profile/Avatar';

const NAV_LINKS = [
	{ to: '/', key: 'navbar.home' },
	{ to: '/editor', key: 'navbar.editor' },
	{ to: '/train', key: 'navbar.train' },
	{ to: '/tower', key: 'navbar.tower' },
	{ to: '/duel', key: 'duel_page.duel' }
] as const;

export function Navbar() {
	const { user, logout, loading } = useAuth();
	const [menuOpen, setMenuOpen] = useState(false);
	const { t } = useTranslation();

	const linkClass = ({ isActive }: { isActive: boolean }) =>
	[
		'text-sm font-medium transition-colors',
		isActive
		? 'text-gold-300'
		: 'text-silver-400 hover:text-gold-300',
	].join(' ');

	return (
	<nav className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-surface-border">
		<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
		{/* Logo */}
		<Link
			to="/"
			className="guild-title font-fantasy text-xl tracking-widest hover:text-gold-300 transition-colors"
		>
			Guilds of the Deep
		</Link>

		{/* Desktop nav */}
		{user && (
			<div className="hidden md:flex items-center gap-6">
			{NAV_LINKS.map(({ to, key }) => (
				<NavLink key={to} to={to} className={linkClass} end={to === '/'}>
				{t(key)}
				</NavLink>
			))}
			</div>
		)}

		{/* Desktop right side */}
		<div className="hidden md:flex items-center gap-3">
			<LanguageSelector/>
			{!loading && (user ? (
			<>
				<Link
				to="/profile"
				className="flex items-center gap-2 text-sm text-silver-300 hover:text-gold-300 transition-colors"
				>
				<div className="
					w-7 h-7
					rounded-full
					bg-gradient-to-br
					from-diamond-500/20
					to-surface-muted
					border border-gold-500/40
					text-gold-200
					flex items-center justify-center
					text-xs font-bold uppercase
					">
					<Avatar
					avatarUrl={user.avatar ?? undefined}
					username={user.username}
					className="w-full h-full"
					/>
				</div>
				<span>{user.username}</span>
				</Link>
				<Button
				variant="ghost"
				size="sm"
				onClick={logout}
				className="text-silver-300 hover:text-ruby-400"
				>
				{t('navbar.disconnect')}
				</Button>
			</>
			) : (
			<>
				<Link to="/login">
				<Button variant="ghost" size="sm">{t('common.login')}</Button>
				</Link>
				<Link to="/register">
				<Button variant="primary" size="sm">{t('common.register')}</Button>
				</Link>
			</>
			))}
		</div>

		{/* Mobile burger */}
		<button
			className="md:hidden p-2 text-silver-300 hover:text-gold-300 transition-colors"
			onClick={() => setMenuOpen((v) => !v)}
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
		>
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			{menuOpen ? (
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
			) : (
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
			)}
			</svg>
		</button>
		</div>

		{/* Mobile menu */}
		{menuOpen && (
		<div className="md:hidden border-t border-surface-border bg-surface px-4 py-3 flex flex-col gap-3">
			<LanguageSelector/>
			{!loading && (user ? (
			<>
				<Link
				to="/profile"
				className="flex items-center gap-2 text-sm text-silver-300 hover:text-gold-300 transition-colors"
				>
				<div className="
					w-7 h-7
					rounded-full
					bg-gradient-to-br
					from-diamond-500/20
					to-surface-muted
					border border-gold-500/40
					text-gold-200
					flex items-center justify-center
					text-xs font-bold uppercase
					">
					<Avatar
					avatarUrl={user.avatar ?? undefined}
					username={user.username}
					className="w-full h-full"
					/>
				</div>
				<span>{user.username}</span>
				</Link>
				{NAV_LINKS.map(({ to, key }) => (
				<NavLink
					key={to}
					to={to}
					className={linkClass}
					end={to === '/'}
					onClick={() => setMenuOpen(false)}
				>
					{t(key)}
				</NavLink>
				))}
				<button
				onClick={() => { logout(); setMenuOpen(false); }}
				className="text-sm text-silver-300 hover:text-ruby-300 text-left transition-colors"
				>
				{t('navbar.disconnect')}
				</button>
			</>
			) : (
			<div className="flex gap-3">
				<Link to="/login" onClick={() => setMenuOpen(false)}>
				<Button variant="ghost" size="sm">
					{t('common.login')}
				</Button>
				</Link>
				<Link to="/register" onClick={() => setMenuOpen(false)}>
				<Button variant="primary" size="sm">
					{t('common.register')}
				</Button>
				</Link>
			</div>
			))}
		</div>
		)}
	</nav>
	);
}
