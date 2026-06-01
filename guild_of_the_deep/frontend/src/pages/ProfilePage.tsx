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

export function ProfilePage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-white/50">
        <p className="text-4xl mb-4">🧙</p>
        <p className="text-lg font-semibold text-white">Profil</p>
        <p className="text-sm mt-2">Page en construction — sprint 3</p>
      </div>
    </Layout>
  );
}
