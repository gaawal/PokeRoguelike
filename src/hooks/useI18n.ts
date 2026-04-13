import { useState, useCallback } from 'react';
import { UI_STRINGS } from '../constants/translations';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState('zh-hans');

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const lang = currentLanguage.startsWith('zh') ? currentLanguage : (UI_STRINGS[currentLanguage] ? currentLanguage : 'en');
    let str = UI_STRINGS[lang]?.[key] || UI_STRINGS['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.split(`{${k}}`).join(String(v));
      });
    }
    return str;
  }, [currentLanguage]);

  const getLocalized = useCallback((obj: any, key: string = 'name') => {
    if (!obj) return '';
    
    if (obj.id && (obj.id === 'potion' || obj.id === 'pokeball' || obj.isBall || obj.isBattleItem)) {
      return currentLanguage.startsWith('zh') ? obj.zhName : obj.name;
    }

    if (obj.names && Array.isArray(obj.names)) {
      const entry = obj.names.find((n: any) => 
        n.language.name.toLowerCase() === currentLanguage.toLowerCase()
      );
      if (entry) return entry.name;
      
      if (currentLanguage.toLowerCase().startsWith('zh')) {
        const alt = obj.names.find((n: any) => 
          n.language.name.toLowerCase() === (currentLanguage.toLowerCase() === 'zh-hans' ? 'zh-hant' : 'zh-hans')
        );
        if (alt) return alt.name;
      }
      
      const en = obj.names.find((n: any) => n.language.name === 'en');
      if (en) return en.name;
    }

    return obj.zhName || obj.name || '';
  }, [currentLanguage]);

  const getLocalizedDesc = useCallback((obj: any) => {
    if (!obj) return '';
    
    if (obj.id && (obj.id === 'potion' || obj.id === 'pokeball' || obj.isBall || obj.isBattleItem)) {
      return currentLanguage.startsWith('zh') ? obj.zhDescription : obj.description;
    }

    if (obj.flavor_text_entries && Array.isArray(obj.flavor_text_entries)) {
      const entry = obj.flavor_text_entries.find((n: any) => 
        n.language.name.toLowerCase() === currentLanguage.toLowerCase()
      );
      if (entry) return entry.flavor_text;
      
      const en = obj.flavor_text_entries.find((n: any) => n.language.name.toLowerCase() === 'en');
      if (en) return en.flavor_text;
    }

    return obj.zhDescription || obj.description || '';
  }, [currentLanguage]);

  const getLocalizedNature = useCallback((nature: any) => {
    if (currentLanguage.startsWith('zh')) return nature.zhName;
    return nature.name;
  }, [currentLanguage]);

  const getStatName = useCallback((stat: string) => {
    return t(stat) || stat;
  }, [t]);

  return {
    currentLanguage,
    setCurrentLanguage,
    t,
    getLocalized,
    getLocalizedDesc,
    getLocalizedNature,
    getStatName
  };
};
