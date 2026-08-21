
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PlayerHub } from './PlayerHub';
import { useAuth } from '@/context/auth.context';

interface LayoutProps {
	children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
	const { user } = useAuth();
	const { pathname } = useLocation();
	const showHub = user && !pathname.startsWith('/editor') && !pathname.startsWith('/profile');

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-start">
				{showHub && (
					<aside className="hidden lg:block shrink-0 p-4 sticky top-14">
						<PlayerHub />
					</aside>
				)}
				<main className="flex-1 min-w-0">{children}</main>
			</div>
			<Footer />
		</div>
	);
}
