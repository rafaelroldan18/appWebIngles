'use client';

/**
 * TheoryViewer - Visual Rendering Engine for GrapesJS Designs
 * Safely renders the HTML and CSS "art" created by the teacher.
 * Optimized for a compact, adaptable Modal view.
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Sparkles, X, BookOpen, Minimize2, Maximize2 } from 'lucide-react';

interface TheoryViewerProps {
    title: string;
    content: any; // { html: string, css: string }
    onClose: () => void;
}

export default function TheoryViewer({ title, content, onClose }: TheoryViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Process the content for display
    const renderedContent = useMemo(() => {
        if (!content) return { html: 'No hay contenido disponible.', css: '' };

        if (typeof content === 'string') {
            try {
                const parsed = JSON.parse(content);
                return {
                    html: parsed.html || 'No se pudo cargar el diseño.',
                    css: parsed.css || ''
                };
            } catch (e) {
                return { html: `<div style="padding: 20px; font-size: 1rem; font-family: sans-serif;">${content}</div>`, css: '' };
            }
        }

        return {
            html: content.html || 'No se pudo cargar el diseño.',
            css: content.css || ''
        };
    }, [content]);

    // Adapt content scale to fix exactly in the modal width
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const designWidth = 850; // Standard design width from editor
                if (containerWidth < designWidth + 40) { // 40 for padding
                    const newScale = (containerWidth - 40) / designWidth;
                    setScale(newScale);
                } else {
                    setScale(1);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">

                {/* Modal Header - Compact */}
                <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-1 opacity-80">
                                <Sparkles className="w-2 h-2" /> REPASO RÁPIDO
                            </span>
                            <h2 className="text-sm font-black tracking-tight uppercase leading-none">{title}</h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors group"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                {/* Modal Content Area - Responsive & Scalable */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-slate-50 overflow-y-auto p-4 flex flex-col items-center custom-scrollbar scroll-smooth"
                >
                    <div
                        className="bg-white shadow-2xl relative transition-transform duration-300 origin-top mb-8"
                        style={{
                            width: '850px',
                            minHeight: '1000px',
                            transform: `scale(${scale})`,
                            marginBottom: `${(scale - 1) * 1000}px` // Adjust margin to prevent empty space below
                        }}
                    >
                        {/* Scoped CSS to prevent leaks and handle absolute layout */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .gjs-rendered-html {
                                position: relative;
                                width: 850px;
                                min-height: 1000px;
                                margin: 0;
                                background-color: white;
                                overflow: hidden;
                            }
                            .gjs-rendered-html * { 
                                box-sizing: border-box; 
                                font-family: 'Inter', sans-serif;
                            }
                            /* Inject GrapesJS CSS with scoping */
                            ${renderedContent.css.replace(/body/g, '.gjs-rendered-html')}
                        ` }} />

                        <div
                            className="gjs-rendered-html"
                            dangerouslySetInnerHTML={{ __html: renderedContent.html }}
                        />
                    </div>
                </div>

                {/* Modal Footer - Minimal */}
                <div className="bg-white px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {scale < 1 ? (
                            <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                Vista adaptada al {Math.round(scale * 100)}%
                            </span>
                        ) : (
                            <span className="text-[8px] font-black text-green-500 uppercase bg-green-50 px-2 py-0.5 rounded">
                                Vista original
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-black text-[9px] hover:bg-indigo-600 transition-all active:scale-95 shadow-sm uppercase tracking-widest"
                    >
                        Cerrar Repaso
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
}
