
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

function ActionIcon({ src, alt }: { src: string; alt: string }) {
  return (
	<div className="mb-4 flex h-16 items-center justify-center">
	  <img src={src} alt={alt} className="max-h-14 max-w-14 object-contain opacity-70 group-hover:opacity-100 transition-all" />
	</div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
	<Layout>
	  <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">
		{/* Hero */}
		<div className="text-center space-y-4">
		  <h1 className="guild-title-strong font-fantasy text-5xl tracking-widest">
  			Guilds of the Deep
		</h1>
		  <p className="text-silver-400 text-base leading-relaxed max-w-xl mx-auto">
  			{t('home_page.lore')}
		</p>
		</div>

		{user ? (
		  <>
			{/* Action buttons */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
			  <Link to="/editor">
				<button className="gold-edge-hover w-full bg-surface-raised hover:bg-surface-hover border border-surface-border rounded-xl p-6 text-left group">
				  <ActionIcon src="/assets/icons/map.svg" alt="" />
				  <h3 className="font-semibold text-silver-100 group-hover:text-gold-300 transition-colors">
					{t('home_page.create_map')}
				  </h3>
				  <p className="text-xs text-silver-400 group-hover:text-silver-200 mt-1 transition-colors">
					{t('home_page.map_instructions')}
				  </p>
				</button>
			  </Link>

			  <Link to="/train">
				<button className="gold-edge-hover w-full bg-surface-raised hover:bg-surface-hover border border-surface-border rounded-xl p-6 text-left group">
				  <ActionIcon src="/assets/icons/training.svg" alt="" />
				  <h3 className="font-semibold text-silver-100 group-hover:text-gold-300 transition-colors">
					{t('navbar.train')}
				  </h3>
				  <p className="text-xs text-silver-400 group-hover:text-silver-200 mt-1 transition-colors">
					{t('home_page.train_d')}
				  </p>
				</button>
			  </Link>

			  <Link to="/tower">
				<button className="gold-edge-hover w-full bg-surface-raised hover:bg-surface-hover border border-surface-border rounded-xl p-6 text-left group">
				  <ActionIcon src="/assets/icons/tower.svg" alt="" />
				  <h3 className="font-semibold text-silver-100 group-hover:text-gold-300 transition-colors">
					{t('home_page.climb_tower')}
				  </h3>
				  <p className="text-xs text-silver-400 group-hover:text-silver-200 mt-1 transition-colors">
					{t('home_page.climb_tower_d')}
				  </p>
				</button>
			  </Link>

			  <Link to="/duel">
				<button className="gold-edge-hover w-full bg-surface-raised hover:bg-surface-hover border border-surface-border rounded-xl p-6 text-left group">
				  <ActionIcon src="/assets/icons/duel.svg" alt="" />
				  <h3 className="font-semibold text-silver-100 group-hover:text-gold-300 transition-colors">
					{t('duel_page.duel')}
				  </h3>
				  <p className="text-xs text-silver-400 group-hover:text-silver-200 mt-1 transition-colors">
					{t('home_page.duel_d')}
				  </p>
				</button>
			  </Link>
			</div>
		  </>
		) : (
		  /* Non-connected CTA */
		  <div className="text-center">
			<Link to="/login">
			  <Button size="lg" className="shadow-glow">
				{t('home_page.play_now')}
			  </Button>
			</Link>
			<p className="mt-3 text-sm text-silver-400">
			  {t('login_page.no_account')}{' '}
			  <Link to="/register" className="text-gold-300 hover:text-gold-200 transition-colors">
				{t('common.to_register')}
			  </Link>
			</p>
		  </div>
		)}
	  </div>
	</Layout>
  );
}
