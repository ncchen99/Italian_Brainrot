import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES, getLanguageMeta } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const current = getLanguageMeta(i18n.language);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const selectLanguage = (code) => {
    setOpen(false);
    if (code !== i18n.language) i18n.changeLanguage(code);
  };

  return (
    <div ref={containerRef} className="absolute top-4 end-4 z-50">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1E293B]/80 backdrop-blur-md rounded-full border border-white/20 shadow-lg text-white hover:bg-[#F59E0B]/20 transition-all font-bold text-sm"
      >
        <Globe className="w-4 h-4" />
        <span>{current.label}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full end-0 mt-2 min-w-[9rem] py-1 bg-[#1E293B]/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current.code;
            return (
              <li key={lang.code}>
                <button
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectLanguage(lang.code)}
                  // `lang` picks the right font for the label; direction stays the
                  // menu's so all three options align to the same edge.
                  lang={lang.htmlLang}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-bold text-start transition-colors ${
                    isActive ? 'text-[#FBBF24] bg-white/10' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span>{lang.label}</span>
                  {isActive && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
