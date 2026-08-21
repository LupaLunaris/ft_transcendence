import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
	const { t } = useTranslation();
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-surface-border bg-surface/90">
			<div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
				<p className="text-xs text-silver-400">
					© {year} Guilds of the Deep. {t('footer.rights')}
				</p>

				<div className="flex items-center gap-5">
					<Link
						to="/terms"
						className="text-xs text-silver-400 hover:text-gold-300 transition-colors"
					>
						{t('footer.terms')}
					</Link>
					<Link
						to="/privacy"
						className="text-xs text-silver-400 hover:text-gold-300 transition-colors"
					>
						{t('footer.privacy')}
					</Link>
				</div>
			</div>
		</footer>
	);
}
