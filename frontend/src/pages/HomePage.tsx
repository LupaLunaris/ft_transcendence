/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* HomePage.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

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
            {/* Player card */}
            <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6 flex items-center gap-5">
              <div className="
				w-14 h-14
				rounded-full
				bg-gradient-to-br
				from-diamond-500/20
				to-surface-muted
				border border-gold-500/40
				shadow-gold-soft
				flex items-center justify-center
				text-2xl font-bold font-fantasy
				text-gold-200
				shrink-0
				">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-silver-100">{user.username}</p>
                <div className="flex gap-4 mt-1 text-sm text-silver-400">
                  <span className="flex items-center gap-1">
					<img
						src="/assets/icons/diamond.svg"
						alt=""
						className="w-3.5 h-3.5 opacity-90"
					/>
					{t('home_page.diamond_count', { count: user.diamonds})}
					</span>
                  <span className="flex items-center gap-1">
					<img
						src="/assets/icons/tower.svg"
						alt=""
						className="w-3.5 h-3.5 opacity-90"
					/>
					{t('congratulatory_modal.level')} {user.tower_progress}
					</span>
                  <span className="flex items-center gap-1">
					<img
						src="/assets/icons/map.svg"
						alt=""
						className="w-3.5 h-3.5 opacity-90"
					/>
					{t('home_page.map_count', { count: user.created_maps_count })}
					</span>
                </div>
              </div>
            </div>

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
