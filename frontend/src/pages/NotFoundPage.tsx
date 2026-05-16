/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* NotFoundPage.tsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 p-4">
      <p className="font-fantasy text-8xl text-deep-700">404</p>
      <h1 className="text-2xl font-semibold text-white">Salle introuvable</h1>
      <p className="text-white/50 text-sm">Ce couloir n'existe pas dans le donjon.</p>
      <Link to="/"><Button variant="secondary">Retour à l'accueil</Button></Link>
    </div>
  );
}
