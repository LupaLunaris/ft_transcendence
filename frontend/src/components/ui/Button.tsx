/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* Button.tsx                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42belgium.be      +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-surface-raised border border-gold-500/45 text-silver-100 shadow-gold-button hover:border-gold-300 hover:text-gold-200 hover:bg-surface-gold focus:ring-gold-400',
  secondary:
    'bg-surface-raised hover:bg-surface-hover text-silver-100 border border-surface-border hover:border-gold-500/50 focus:ring-gold-400',
  danger:
    'bg-red-600 hover:bg-ruby-400 text-white focus:ring-ruby-400',
  ghost:
    'bg-transparent hover:bg-surface-raised text-silver-300 hover:text-gold-300 focus:ring-gold-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-5 py-2 text-base rounded-md',
  lg: 'px-7 py-3 text-lg rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
}
