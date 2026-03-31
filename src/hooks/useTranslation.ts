import { useState, useCallback } from 'react';
import { UI_STRINGS } from '../constants/translations';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState('zh-hans');

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const lang = currentLanguage.startsWith('zh') ? currentLanguage : (UI_STRINGS[currentLanguage] ? currentLanguage : 'en');
    let str = UI_STRINGS[lang]?.[key] || UI_STRINGS['en']?.[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }, [currentLanguage]);

  return { t, currentLanguage, setLanguage: setCurrentLanguage };
};
