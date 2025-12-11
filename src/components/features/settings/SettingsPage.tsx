'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import AccountTab from './AccountTab';
import PreferencesTab from './PreferencesTab';
import { colors } from '@/config/colors';

interface SettingsPageProps {
  onBack?: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'account' | 'preferences'>('account');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Regresar al dashboard"
            className={`w-9 h-9 sm:w-10 sm:h-10 ${colors.background.card} ${colors.border.light} hover:${colors.background.hover} hover:border-blue-400 dark:hover:border-blue-600 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90`}
          >
            <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text.secondary}`} aria-hidden="true" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-white">{t.settings.title}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className={`flex lg:flex-col gap-2 ${colors.background.card} rounded-xl p-3 sm:p-4 shadow-lg overflow-x-auto lg:overflow-x-visible`}>
            <button
              onClick={() => setActiveTab('account')}
              aria-label="Configuración de cuenta"
              aria-current={activeTab === 'account' ? 'page' : undefined}
              className={`flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95 ${activeTab === 'account'
                  ? `bg-gradient-to-r ${colors.primary.gradient} text-white`
                  : `${colors.text.secondary} hover:${colors.background.hover}`
                }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="text-sm sm:text-base font-medium">{t.settingsAccount}</span>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              aria-label="Preferencias de usuario"
              aria-current={activeTab === 'preferences' ? 'page' : undefined}
              className={`flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95 ${activeTab === 'preferences'
                  ? `bg-gradient-to-r ${colors.primary.gradient} text-white`
                  : `${colors.text.secondary} hover:${colors.background.hover}`
                }`}
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="text-sm sm:text-base font-medium">{t.settingsPreferences}</span>
            </button>
          </nav>
        </div>

        <div className={`flex-1 ${colors.background.card} rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg`}>
          {activeTab === 'account' && <AccountTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
