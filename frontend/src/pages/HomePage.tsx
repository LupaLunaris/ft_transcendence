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

const LORE = `Quelque part sous la terre, dans des mines oubliées, une résistance s'est formée.
D'anciens mineurs et bâtisseurs t'ont recueilli et t'entraînent dans leurs labyrinthes
pour faire de toi un vrai aventurier. Ton but : gravir la tour et affronter la sorcière
Meduza qui règne sur les profondeurs. Apprends à construire tes propres couloirs,
entraîne-toi, et prépare-toi à l'ascension.`;

export function HomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="font-fantasy text-5xl text-deep-300 tracking-widest">
            Guilds of the Deep
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xl mx-auto">
            {LORE}
          </p>
        </div>

        {user ? (
          <>
            {/* Player card */}
            <div className="bg-surface-raised border border-surface-border rounded-xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-deep-700 flex items-center justify-center text-2xl font-bold font-fantasy text-deep-200 shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold text-white">{user.username}</p>
                <div className="flex gap-4 mt-1 text-sm text-white/50">
                  <span>💎 {user.diamonds} diamants</span>
                  <span>🗼 Niveau {user.tower_progress}</span>
                  <span>🗺 {user.created_maps_count} map{user.created_maps_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/editor">
                <button className="w-full bg-surface-raised hover:bg-surface-muted border border-surface-border rounded-xl p-6 text-left transition-all group">
                  <div className="text-3xl mb-3">🗺</div>
                  <h3 className="font-semibold text-white group-hover:text-deep-300 transition-colors">
                    Créer une map
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    Dessine ton donjon et défie la communauté
                  </p>
                </button>
              </Link>

              <Link to="/train">
                <button className="w-full bg-surface-raised hover:bg-surface-muted border border-surface-border rounded-xl p-6 text-left transition-all group">
                  <div className="text-3xl mb-3">⚔️</div>
                  <h3 className="font-semibold text-white group-hover:text-deep-300 transition-colors">
                    S'entraîner
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    Parcours les maps de la communauté
                  </p>
                </button>
              </Link>

              <Link to="/tower">
                <button className="w-full bg-surface-raised hover:bg-surface-muted border border-surface-border rounded-xl p-6 text-left transition-all group">
                  <div className="text-3xl mb-3">🗼</div>
                  <h3 className="font-semibold text-white group-hover:text-deep-300 transition-colors">
                    Monter la tour
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    8 niveaux officiels à conquérir
                  </p>
                </button>
              </Link>
            </div>
          </>
        ) : (
          /* Non-connected CTA */
          <div className="text-center">
            <Link to="/register">
              <Button size="lg" className="shadow-glow">
                Jouer maintenant
              </Button>
            </Link>
            <p className="mt-3 text-sm text-white/40">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-deep-300 hover:text-deep-200 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
