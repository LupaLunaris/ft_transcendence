/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* ProfilePage.tsx                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42belgium.be        +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis         #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis        ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Layout } from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/auth.context';
import { useTranslation } from 'react-i18next';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="py-20 flex justify-center">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-white/60">
          <p>Tu dois être connectée pour voir ton profil.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
          <div className="flex flex-col items-center gap-4 text-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`Avatar de ${user.username}`}
                className="h-24 w-24 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="h-24 w-24 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-4xl">
                🧙
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">
                {t('profile_page.profile')}
              </h1>
              <p className="text-white/70">@{user.username}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-bold">{user.diamonds}</p>
              <p className="text-sm text-white/60">Diamonds</p>
            </div>

            <div className="rounded-xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-bold">{user.tower_progress}</p>
              <p className="text-sm text-white/60">Tower progress</p>
            </div>

            <div className="rounded-xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-bold">{user.created_maps_count}</p>
              <p className="text-sm text-white/60">Maps créées</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-black/20 p-4 text-sm text-white/70">
            <p>
              Compte créé le{' '}
              {new Date(user.created_at).toLocaleDateString('fr-BE')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}