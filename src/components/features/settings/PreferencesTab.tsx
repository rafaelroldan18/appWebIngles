'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Check } from 'lucide-react';
import { colors } from '@/config/colors';

export default function PreferencesTab() {
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [message, setMessage] = useState('');

  const { t } = useLanguage();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setMessage(t.settingsThemeUpdated);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLanguageChange = (newLang: 'es' | 'en') => {
    setLocale(newLang);
    setMessage(t.settingsLanguageUpdated);
    setTimeout(() => setMessage(''), 3000);
  };

  const themes = [
    { id: 'light', name: t.settingsThemeLight, icon: Sun },
    { id: 'dark', name: t.settingsThemeDark, icon: Moon },
  ];

  const languages = [
    { id: 'es', name: 'Español', flag: '' },
    { id: 'en', name: 'English', flag: '' },
  ];

  return (
    <div className="space-y-8">
      {message && (
        <div className={`${colors.status.success.bg} ${colors.status.success.border} ${colors.status.success.text} px-4 py-3 rounded-lg text-sm`}>
          {message}
        </div>
      )}
      <div>
        <h2 className={`text-2xl font-bold mb-2 ${colors.text.title}`}>{t.settingsTheme}</h2>
        <p className={`${colors.text.secondary} mb-6`}>{t.settingsThemeDesc}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id as any)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${colors.primary.border} ${colors.primary.bg}`
                    : `${colors.border.light} ${colors.background.base} hover:${colors.border.medium}`
                }`}
              >
                {isSelected && (
                  <div className={`absolute top-2 right-2 w-5 h-5 bg-gradient-to-r ${colors.primary.gradient} rounded-full flex items-center justify-center`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected ? `bg-gradient-to-br ${colors.primary.gradient} text-white` : `${colors.background.hover} ${colors.text.secondary}`
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-medium ${colors.text.primary} text-sm`}>{t.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`border-t-2 ${colors.border.light} pt-8`}>
        <h2 className={`text-2xl font-bold mb-2 ${colors.text.title}`}>{t.settingsLanguageTitle}</h2>
        <p className={`${colors.text.secondary} mb-6`}>{t.settingsLanguageDesc}</p>
        
        <div className="relative">
          <select
            value={locale}
            onChange={(e) => handleLanguageChange(e.target.value as 'es' | 'en')}
            className={`w-full px-4 py-3 ${colors.background.base} ${colors.border.light} rounded-lg focus:${colors.border.focus} focus:outline-none appearance-none cursor-pointer ${colors.text.primary}`}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className={`w-5 h-5 ${colors.text.secondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
