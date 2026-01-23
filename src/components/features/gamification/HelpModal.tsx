'use client';

import { X, HelpCircle, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    sections: {
        title: string;
        items: string[];
    }[];
    example?: string;
}

export default function HelpModal({
    isOpen,
    onClose,
    title,
    description,
    sections,
    example
}: HelpModalProps) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">
                                {title}
                            </h2>
                            <p className="text-indigo-100 text-sm font-medium">
                                {t.gamification.general.guide}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Description */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 mb-6 border border-indigo-100 dark:border-indigo-800">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {description}
                        </p>
                    </div>

                    {/* Sections */}
                    {sections.map((section, index) => (
                        <div key={index} className="mb-6">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-indigo-600" />
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.items.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
                                    >
                                        <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Example */}
                    {example && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="w-5 h-5 text-purple-600" />
                                <h4 className="font-black text-purple-900 dark:text-purple-300">
                                    {t.gamification.general.example}
                                </h4>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium italic">
                                {example}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg active:scale-95"
                    >
                        {t.gamification.general.gotIt}
                    </button>
                </div>
            </div>
        </div>
    );
}
