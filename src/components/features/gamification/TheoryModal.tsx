'use client';

/**
 * TheoryModal - Muestra el contenido de teoría antes de iniciar un juego
 * Se muestra cuando show_theory está activo en game_availability
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { X, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopicRule {
    rule_id: string;
    topic_id: string;
    title: string | null;
    content_json: any;
    format: 'json' | 'plain' | 'html' | 'markdown';
    order_index: number;
}

/**
 * Simplified rendering engine for GrapesJS content inside other components
 */
function TheoryViewerEmbed({ content, title }: { content: any, title: string }) {
    const { t } = useLanguage();
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(800);

    const renderedContent = useMemo(() => {
        if (!content) return { html: '', css: '' };
        if (typeof content === 'string') {
            try {
                const parsed = JSON.parse(content);
                return {
                    html: parsed.html || '',
                    css: parsed.css || ''
                };
            } catch {
                return { html: content, css: '' };
            }
        }
        return {
            html: content.html || '',
            css: content.css || ''
        };
    }, [content]);

    useEffect(() => {
        const updateHeight = () => {
            if (contentRef.current) {
                const children = contentRef.current.querySelectorAll('*');
                let maxBottom = 600;
                children.forEach((child: any) => {
                    const rect = child.getBoundingClientRect();
                    const parentRect = contentRef.current!.getBoundingClientRect();
                    const bottom = (rect.bottom - parentRect.top) / scale;
                    if (bottom > maxBottom) maxBottom = bottom;
                });
                setContentHeight(Math.max(maxBottom + 50, contentRef.current.scrollHeight));
            }
        };
        const timer = setTimeout(updateHeight, 500);
        return () => clearTimeout(timer);
    }, [renderedContent, scale]);

    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            if (containerWidth < 850) {
                setScale(containerWidth / 850);
            }
        }
    }, []);

    return (
        <div ref={containerRef} className="w-full flex flex-col items-center bg-white">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
            <div
                style={{
                    width: '850px',
                    minHeight: `${contentHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    marginBottom: `${(scale - 1) * contentHeight}px`,
                    position: 'relative'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .gjs-embed-wrapper {
                        position: relative;
                        width: 850px;
                        margin: 0;
                        background-color: white;
                        color: #1e293b;
                    }
                    .gjs-embed-wrapper * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
                    ${renderedContent.css
                            .replace(/body/g, '.gjs-embed-wrapper')
                            .replace(/#wrapper/g, '.gjs-embed-wrapper')
                            .replace(/html/g, '.gjs-embed-wrapper')
                        }
                ` }} />
                <div
                    ref={contentRef}
                    className="gjs-embed-wrapper"
                    dangerouslySetInnerHTML={{ __html: renderedContent.html }}
                />
            </div>
        </div>
    );
}

interface TheoryModalProps {
    isOpen: boolean;
    theoryContent: {
        rules: TopicRule[];
        visualDesign: any;
    };
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

    // We consider pages: visualDesign (if exists) + all structured rules
    const hasVisualDesign = !!theoryContent?.visualDesign;
    const rules = theoryContent?.rules || [];
    const totalPages = (hasVisualDesign ? 1 : 0) + rules.length;

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

    // Determine what to show on current page
    let contentToRender;
    if (hasVisualDesign && currentPage === 0) {
        // Show visual design as the first page using TheoryViewer
        contentToRender = (
            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
                <TheoryViewerEmbed
                    content={theoryContent.visualDesign}
                    title={topicTitle}
                />
            </div>
        );
    } else {
        const ruleIndex = hasVisualDesign ? currentPage - 1 : currentPage;
        const currentRule = rules[ruleIndex];
        contentToRender = currentRule ? (
            <div className="space-y-6">
                {currentRule.title && (
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                        {currentRule.title}
                    </h3>
                )}
                {renderContent(currentRule)}
            </div>
        ) : null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-gray-800 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                Repaso de Teoría
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
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
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {contentToRender}

                    {totalPages === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500 dark:text-gray-400">
                                No hay contenido de teoría disponible para este tema.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${idx === currentPage
                                    ? 'w-6 bg-indigo-600'
                                    : 'w-1.5 bg-slate-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                        {totalPages > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-widest">
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
