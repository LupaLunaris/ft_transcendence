
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Nederlands' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = i18n.language.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium
                   text-silver-300 hover:text-gold-300 border border-surface-border
                   hover:border-gold-500/50 rounded transition-colors"
      >
        {current}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-surface border border-surface-border
                        rounded shadow-lg z-50 min-w-[140px] overflow-hidden">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => { i18n.changeLanguage(code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between
                          hover:bg-surface-raised transition-colors
                          ${i18n.language.startsWith(code)
                            ? 'text-gold-300'
                            : 'text-silver-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}