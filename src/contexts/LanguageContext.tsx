'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  showMotivationalMessage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hook personalizado para usar el contexto de idioma
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Obtener idioma guardado en localStorage o usar español por defecto
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('appLanguage');
    if (saved) {
      setLanguageState(saved as Language);
    }
  }, []);
  
  // Función de traducción: recibe una clave y devuelve el texto traducido
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Cambiar idioma y guardar en localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, showMotivationalMessage: false }}>
      {children}
    </LanguageContext.Provider>
  );
}
