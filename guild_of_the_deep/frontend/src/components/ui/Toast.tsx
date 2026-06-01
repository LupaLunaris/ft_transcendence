/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* Toast.tsx                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import type { Toast } from './useToast';
import { useToastContext } from './useToast';

const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-deep-700 border-deep-400 text-deep-100',
  error: 'bg-surface-raised border-coral-500 text-white',
  info: 'bg-surface-raised border-abyss-400 text-white',
};

const typeIcon: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastContext();

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 min-w-[280px] max-w-sm p-4 rounded-lg border shadow-lg',
        'animate-in fade-in slide-in-from-right-4 duration-200',
        typeStyles[toast.type],
      ].join(' ')}
    >
      <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
        {typeIcon[toast.type]}
      </span>
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 text-white/40 hover:text-white transition-colors text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
