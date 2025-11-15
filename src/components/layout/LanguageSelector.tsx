import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Locale } from '@/i18n/config';

const languages = {
  es: { name: 'Español', code: 'ES' },
  en: { name: 'English', code: 'EN' },
};

export default function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Locale) => {
    setLocale(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 transition-all hover:shadow-sm backdrop-blur-sm"
      >
        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline text-sm text-slate-700 dark:text-gray-300">
          {t.settings.language}: <span className="font-semibold">{languages[locale].name}</span>
        </span>
        <span className="sm:hidden text-sm font-bold text-blue-600 dark:text-blue-400">{languages[locale].code}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 w-48 z-50 animate-fadeIn">
          {Object.entries(languages).map(([code, { name, code: langCode }]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code as Locale)}
              className={`w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                locale === code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-gray-300'
              }`}
            >
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{langCode}</span>
              <span>{name}</span>
              {locale === code && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
