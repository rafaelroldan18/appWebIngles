/**
 * Modal de configuración para generar contenido con IA
 */

import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    gameName: string;
    config: {
        count: number;
        contextNote: string;
    };
    onConfigChange: (config: { count: number; contextNote: string }) => void;
}

export default function AIGenerationModal({
    isOpen,
    onClose,
    onGenerate,
    isGenerating,
    gameName,
    config,
    onConfigChange
}: AIModalProps) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">
                            {t.gamification.ai.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                            {gameName}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Cantidad */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">
                            {t.gamification.ai.countLabel}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={config.count}
                            onChange={(e) => onConfigChange({ ...config, count: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white font-bold"
                        />
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                            {t.gamification.ai.countHelp}
                        </p>
                    </div>

                    {/* Contexto */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">
                            {t.gamification.ai.contextLabel}
                        </label>
                        <input
                            type="text"
                            value={config.contextNote}
                            onChange={(e) => onConfigChange({ ...config, contextNote: e.target.value })}
                            placeholder={t.gamification.ai.contextPlaceholder}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white"
                        />
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                            {t.gamification.ai.contextHelp}
                        </p>
                    </div>

                    {/* Info */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                            {t.gamification.ai.infoTip}
                        </p>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        {t.gamification.ai.cancel}
                    </button>
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t.gamification.ai.generating}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {t.gamification.ai.generate}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
