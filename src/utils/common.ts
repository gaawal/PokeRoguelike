import { useCallback } from 'react';

export const getLocalized = (obj: any, currentLanguage: string, key: string = 'name') => {
  if (!obj) return '';
  
  // Special case for Pokemon and Move names
  if (obj.names && Array.isArray(obj.names)) {
    const localized = obj.names.find((n: any) => n.language.name === currentLanguage);
    if (localized) return localized.name;
    
    // Fallback to zh-hans if current is not found
    const zhHans = obj.names.find((n: any) => n.language.name === 'zh-hans');
    if (zhHans) return zhHans.name;
    
    // Fallback to en
    const en = obj.names.find((n: any) => n.language.name === 'en');
    if (en) return en.name;
  }

  // Fallback to zhName if available
  if (currentLanguage.startsWith('zh') && obj.zhName) return obj.zhName;
  
  return obj[key] || '';
};

export const formatStatName = (stat: string, STAT_ZH: Record<string, string>) => {
  return STAT_ZH[stat] || stat;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
