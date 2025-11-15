'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import AccountTab from './AccountTab';
import PreferencesTab from './PreferencesTab';

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
            className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0288D1] dark:text-blue-400">{t.settings.title}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2 bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-lg overflow-x-auto lg:overflow-x-visible">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">{t.settingsAccount}</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'preferences'
                    ? 'bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">{t.settingsPreferences}</span>
              </button>
            </nav>
          </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
          {activeTab === 'account' && <AccountTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
