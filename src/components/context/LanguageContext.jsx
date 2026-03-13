import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('app_lang') || 'en'; } catch { return 'en'; }
  });

  const changeLang = (newLang) => {
    setLang(newLang);
    try { localStorage.setItem('app_lang', newLang); } catch {}
  };

  const t = (key, fallback) =>
    translations[lang]?.[key] ?? translations.en?.[key] ?? fallback ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      changeLang: () => {},
      t: (key, fallback) => translations.en?.[key] ?? fallback ?? key,
    };
  }
  return ctx;
};