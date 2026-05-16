/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* TowerPage.tsx                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Layout } from '@/components/layout/Layout';

export function TowerPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-white/50">
        <p className="text-4xl mb-4">🗼</p>
        <p className="text-lg font-semibold text-white">La Tour</p>
        <p className="text-sm mt-2">8 niveaux officiels — sprint 3</p>
      </div>
    </Layout>
  );
}
