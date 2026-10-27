import React, { createContext, useContext, useState, useMemo } from 'react';

// Automatically load all *.en.json and *.hi.json files across all phases
const enModules = import.meta.glob('./*.en.json', { eager: true });
const hiModules = import.meta.glob('./*.hi.json', { eager: true });

function mergeBundles(modules) {
  const merged = {};
  for (const path in modules) {
    const content = modules[path].default || modules[path];
    Object.assign(merged, content);
  }
  return merged;
}

const translations = {
  en: mergeBundles(enModules),
  hi: mergeBundles(hiModules),
};

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() =>
    typeof navigator !== 'undefined' && /^hi/i.test(navigator.language || '') ? 'hi' : 'en'
  );

  const setLang = (newLang) => {
    setLangState(newLang === 'hi' ? 'hi' : 'en');
  };

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
  };

  const value = useMemo(() => {
    const currentBundle = translations[lang] || translations.en;
    const fallbackBundle = translations.en;

    const t = (key) => {
      if (currentBundle && currentBundle[key] !== undefined) {
        return currentBundle[key];
      }
      if (fallbackBundle && fallbackBundle[key] !== undefined) {
        return fallbackBundle[key];
      }
      return key;
    };

    return { lang, setLang, toggleLang, t };
  }, [lang]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export default translations;
