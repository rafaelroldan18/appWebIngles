'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';
import { es } from '@/i18n/translations/es';
import { en } from '@/i18n/translations/en';

const translations = { es, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof es;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'app-locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (stored && (stored === 'es' || stored === 'en')) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const t = translations[locale];

  const value = useMemo(() => ({
    locale,
    setLocale,
    t
  }), [locale, t]);

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
