'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <p className="text-center text-sm text-slate-600 dark:text-gray-400">
                    {t.footerCopyright}{' '}
                    <span className="font-semibold text-slate-800 dark:text-white">{t.footerDeveloper}</span>.{' '}
                    {t.footerProject}
                </p>
            </div>
        </footer>
    );
}
