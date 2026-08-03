
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-white/80"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-md bg-surface-raised border px-3 py-2 text-white text-sm',
          'placeholder:text-white/30 outline-none transition-all duration-150',
          error
            ? 'border-coral-500 focus:ring-2 focus:ring-coral-500/50'
            : 'border-surface-border focus:ring-2 focus:ring-deep-400/50 focus:border-deep-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p className="text-xs text-coral-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
