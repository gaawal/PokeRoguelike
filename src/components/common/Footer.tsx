import React from 'react';
import { SUPPORTED_LANGUAGES } from '../../types';

interface FooterProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="bg-white border-t-4 border-slate-800 px-8 py-4 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
      <div className="flex items-center gap-6">
        <span>© 2026 Pokemon Rogue Engine</span>
        <div className="h-4 w-px bg-slate-200" />
        <span>v2.0.0 Refactored</span>
      </div>
      
      <div className="flex gap-4">
        {SUPPORTED_LANGUAGES.map(lang => (
          <button 
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`hover:text-slate-800 transition-colors ${currentLanguage === lang.code ? 'text-slate-800 underline underline-offset-4' : ''}`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
};
