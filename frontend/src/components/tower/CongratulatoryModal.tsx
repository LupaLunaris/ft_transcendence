/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* CongratulatoryModal.tsx                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/17 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/17 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CongratulatoryModalProps {
  isOpen: boolean;
  level: number;
  diamonds: number;
  hasNextLevel: boolean;
  onContinue: () => void;
  onHome: () => void;
}

export function CongratulatoryModal({
  isOpen,
  level,
  diamonds,
  hasNextLevel,
  onContinue,
  onHome,
}: CongratulatoryModalProps) {
  const [displayedDiamonds, setDisplayedDiamonds] = useState(0);

  // Animate diamond counter from 0 to final value when modal opens
  useEffect(() => {
    if (!isOpen) {
      setDisplayedDiamonds(0);
      return;
    }

    const start = Math.max(0, diamonds - 1);
    setDisplayedDiamonds(start);

    const duration = 800;
    const steps = diamonds - start;
    if (steps <= 0) return;

    const stepDuration = duration / steps;
    let current = start;

    const interval = setInterval(() => {
      current += 1;
      setDisplayedDiamonds(current);
      if (current >= diamonds) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isOpen, diamonds]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="congrats-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" aria-hidden="true" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl flex flex-col items-center gap-6 p-8 text-center">

        {/* Trophy animation */}
        <div className="text-6xl animate-bounce">🏆</div>

        {/* Title */}
        <h2 id="congrats-title" className="text-2xl font-bold font-fantasy text-white tracking-wide">
          Niveau {level} réussi !
        </h2>

        {/* Reward */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-white/60 text-sm">Tu as gagné un diamant !</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl">💎</span>
            <span className="text-4xl font-bold text-deep-200 tabular-nums transition-all">
              {displayedDiamonds}
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">diamants au total</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={onContinue}
          >
            {hasNextLevel ? `⚔️ Niveau ${level + 1}` : '🏠 Retour à l\'accueil'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onHome}
          >
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
