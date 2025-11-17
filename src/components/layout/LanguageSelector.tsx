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
        className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-[#374151]/80 hover:bg-white dark:hover:bg-[#374151] rounded-lg border border-[#E5E7EB] dark:border-[#6B7280] transition-all hover:shadow-sm backdrop-blur-sm"
      >
        <Globe className="w-4 h-4 text-[#2B6BEE] dark:text-[#6FA0FF]" />
        <span className="hidden sm:inline text-sm text-[#6B7280] dark:text-[#9CA3AF]">
          {t.settings.language}: <span className="font-semibold">{languages[locale].name}</span>
        </span>
        <span className="sm:hidden text-sm font-bold text-[#2B6BEE] dark:text-[#6FA0FF]">{languages[locale].code}</span>
        <ChevronDown className={`w-4 h-4 text-[#9CA3AF] dark:text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#374151] rounded-lg shadow-lg border border-[#E5E7EB] dark:border-[#6B7280] py-1 w-48 z-50 animate-fadeIn">
          {Object.entries(languages).map(([code, { name, code: langCode }]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code as Locale)}
              className={`w-full px-4 py-2 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#6B7280] flex items-center gap-3 transition-colors ${
                locale === code ? 'bg-[#2B6BEE]/10 dark:bg-[#2B6BEE]/30 text-[#2B6BEE] dark:text-[#6FA0FF] font-semibold' : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <span className="text-sm font-bold text-[#2B6BEE] dark:text-[#6FA0FF]">{langCode}</span>
              <span>{name}</span>
              {locale === code && <span className="ml-auto text-[#2B6BEE] dark:text-[#6FA0FF]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
