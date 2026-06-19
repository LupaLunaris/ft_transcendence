/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* GameOverModal.tsx                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/21 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/21 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface GameOverModalProps {
  isOpen: boolean;
  backLabel: string;
  onRestart: () => void;
  onBack: () => void;
}

export function GameOverModal({ isOpen, backLabel, onRestart, onBack }: GameOverModalProps) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" aria-hidden="true" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl flex flex-col items-center gap-6 p-8 text-center">

        <div className="text-6xl">💀</div>

        <div className="flex flex-col gap-1">
          <h2 id="gameover-title" className="text-2xl font-bold font-fantasy text-coral-400 tracking-wide">
            {t('game_over_modal.game_over')}
          </h2>
          <p className="text-white/50 text-sm">
            {t('game_over_modal.ennemy')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" size="md" className="w-full" onClick={onRestart}>
            {t('game_over_modal.retry')}
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
