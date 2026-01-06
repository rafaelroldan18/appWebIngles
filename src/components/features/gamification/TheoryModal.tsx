'use client';

/**
 * TheoryModal - Muestra el contenido de teoría antes de iniciar un juego
 * Se muestra cuando show_theory está activo en game_availability
 */

import { useState } from 'react';
import { X, BookOpen, CheckCircle } from 'lucide-react';

interface TopicRule {
    rule_id: string;
    topic_id: string;
    title: string | null;
    content_json: any;
    format: 'json' | 'plain' | 'html' | 'markdown';
    order_index: number;
}

interface TheoryModalProps {
    isOpen: boolean;
    theoryContent: TopicRule[];
    topicTitle: string;
    onClose: () => void;
    onContinue: () => void;
}

export default function TheoryModal({
    isOpen,
    theoryContent,
    topicTitle,
    onClose,
    onContinue
}: TheoryModalProps) {
    const [currentPage, setCurrentPage] = useState(0);

    if (!isOpen) return null;

    const totalPages = theoryContent.length;
    const currentRule = theoryContent[currentPage];

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            onContinue();
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const renderContent = (rule: TopicRule) => {
        if (rule.format === 'json') {
            // Renderizar contenido JSON estructurado
            return (
                <div className="space-y-4">
                    {rule.content_json?.sections?.map((section: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                            {section.title && (
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {section.title}
                                </h4>
                            )}
                            {section.content && (
                                <p className="text-slate-600 dark:text-gray-300">
                                    {section.content}
                                </p>
                            )}
                            {section.examples && (
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    {section.examples.map((example: string, exIdx: number) => (
                                        <li key={exIdx} className="text-slate-600 dark:text-gray-300">
                                            {example}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            );
        } else if (rule.format === 'html') {
            return (
                <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: rule.content_json }}
                />
            );
        } else {
            // Plain text o markdown
            return (
                <div className="text-slate-600 dark:text-gray-300 whitespace-pre-wrap">
                    {typeof rule.content_json === 'string'
                        ? rule.content_json
                        : JSON.stringify(rule.content_json, null, 2)}
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                Repaso de Teoría
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                {topicTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {currentRule && (
                        <div className="space-y-6">
                            {currentRule.title && (
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                    {currentRule.title}
                                </h3>
                            )}
                            {renderContent(currentRule)}
                        </div>
                    )}

                    {totalPages === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-gray-400">
                                No hay contenido de teoría disponible para este tema.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-8 border-t border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all ${idx === currentPage
                                        ? 'w-8 bg-indigo-600'
                                        : 'w-2 bg-slate-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                        {totalPages > 0 && (
                            <span className="text-sm text-slate-500 dark:text-gray-400 ml-2">
                                {currentPage + 1} / {totalPages}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentPage > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="px-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-gray-700 font-bold transition-all"
                            >
                                Anterior
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black transition-all shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            {currentPage < totalPages - 1 ? (
                                <>Siguiente</>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Comenzar Juego
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
