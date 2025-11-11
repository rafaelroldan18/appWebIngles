import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../i18n/translations';

// Configuración de idiomas disponibles con banderas emoji
const languages = {
  es: { name: 'Español', flag: '🇪🇸' },
  en: { name: 'English', flag: '🇬🇧' },
};

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón selector de idioma */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white rounded-xl border border-gray-200 transition-all hover:shadow-md"
      >
        <Globe className="w-4 h-4 text-[#0288D1]" />
        <span className="hidden sm:inline text-sm text-gray-700">
          {t('idiomaPage')}: <span className="font-semibold">{languages[language].name}</span>
        </span>
        <span className="sm:hidden text-xl">{languages[language].flag}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown con animación */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-50 animate-fadeIn">
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                language === code ? 'bg-blue-50 text-[#0288D1] font-semibold' : 'text-gray-700'
              }`}
            >
              <span className="text-xl">{flag}</span>
              <span>{name}</span>
              {language === code && <span className="ml-auto text-[#0288D1]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
