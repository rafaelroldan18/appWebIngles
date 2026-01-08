'use client';

/**
 * RichTextEditor - High-End Visual Builder powered by GrapesJS
 * Improved with essential editing tools and responsive canvas.
 */

import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { Save, Sparkles, Trash2, Copy, Move, MousePointer2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RichTextEditorProps {
    content: any; // { html: string, css: string, project: any }
    onChange: (content: any) => void;
}

export default React.memo(function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const { t } = useLanguage();
    const editorRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<any>(null);

    // Use a ref for onChange to always have the latest version without re-triggering useEffect
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Use a ref for the debounce timer
    const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Initialize GrapesJS
        const gjsEditor = grapesjs.init({
            container: editorRef.current,
            fromElement: true,
            height: '700px',
            width: '100%',
            commands: {
                defaults: {
                    'canvas-clear': {
                        run: (editor: any) => {
                            if (confirm(t.gamification.editor.confirmClear)) {
                                editor.Components.clear();
                                editor.Css.clear();
                            }
                        }
                    },
                    'select-all': {
                        run: (editor: any) => {
                            const wrapper = editor.Components.getWrapper();
                            if (wrapper) {
                                editor.select(wrapper.get('components').models);
                            }
                        }
                    }
                }
            },
            styleManager: {
                appendTo: '#styles-container',
                sectors: [{
                    name: 'Propiedades del Elemento',
                    open: true,
                    buildProps: ['font-size', 'font-family', 'color', 'font-weight', 'text-align', 'line-height', 'letter-spacing'],
                    properties: [
                        {
                            name: 'Tamaño de Letra', property: 'font-size', type: 'select', options: [
                                { id: '12px', value: '12px', name: 'Muy Pequeña' },
                                { id: '14px', value: '14px', name: 'Pequeña' },
                                { id: '16px', value: '16px', name: 'Normal' },
                                { id: '18px', value: '18px', name: 'Media' },
                                { id: '20px', value: '20px', name: 'Grande' },
                                { id: '24px', value: '24px', name: 'Muy Grande' },
                                { id: '32px', value: '32px', name: 'Título' },
                                { id: '48px', value: '48px', name: 'Cabecera' },
                                { id: '64px', value: '64px', name: 'Gigante' }
                            ]
                        },
                        { name: 'Color de Texto', property: 'color', type: 'color' },
                        {
                            name: 'Grosor', property: 'font-weight', type: 'select', options: [
                                { id: '400', value: '400', name: 'Normal' },
                                { id: '600', value: '600', name: 'Semi-Negrita' },
                                { id: '700', value: '700', name: 'Negrita' },
                                { id: '900', value: '900', name: 'Extra-Negrita' }
                            ]
                        }
                    ]
                }]
            },
            storageManager: false,
            // FORCE ABSOLUTE DRAGGING MODE (The Canva secret)
            dragMode: 'absolute',
            canvas: {
                styles: [
                    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
                    'body { background-color: white; position: relative; min-height: 1000px; width: 100%; margin: 0; }'
                ]
            },
            panels: { defaults: [] }, // Reset panels to avoid the 'ownerDocument' error with custom elements
            blockManager: {
                appendTo: '#blocks',
                blocks: [
                    {
                        id: 'text-heading',
                        label: '<b>Título</b>',
                        content: {
                            type: 'text',
                            content: 'ESCRIBE TU TÍTULO AQUÍ',
                            style: { position: 'absolute', width: '100%', 'font-family': 'Inter, sans-serif', 'font-size': '42px', 'font-weight': '900', color: '#1e293b', 'text-transform': 'uppercase' },
                            editable: true
                        }
                    },
                    {
                        id: 'text-paragraph',
                        label: '<b>Párrafo</b>',
                        content: {
                            type: 'text',
                            content: 'Haz doble clic para escribir un párrafo largo con tus explicaciones pedagógicas...',
                            style: { position: 'absolute', width: '400px', 'font-family': 'Inter, sans-serif', 'font-size': '16px', 'line-height': '1.6', color: '#4b5563' },
                            editable: true
                        }
                    },
                    {
                        id: 'card-grammar',
                        label: '<b>Regla</b>',
                        content: {
                            style: { position: 'absolute', width: '350px', background: '#f8fafc', border: '1px solid #e2e8f0', 'border-left': '6px solid #6366f1', padding: '20px', 'border-radius': '4px' },
                            components: [
                                { type: 'text', content: 'REGLA GRAMATICAL', style: { color: '#6366f1', 'font-weight': '900', 'font-size': '11px', 'margin-bottom': '5px' } },
                                { type: 'text', content: 'Sujeto + Verbo + Complemento', style: { color: '#1e293b', 'font-weight': '700', 'font-size': '16px' } }
                            ]
                        }
                    },
                    {
                        id: 'card-vocab-pro',
                        label: '<b>Vocabulario</b>',
                        content: {
                            style: { position: 'absolute', width: '300px', background: '#fff1f2', border: '1px solid #fecaca', padding: '15px', 'border-radius': '12px' },
                            components: [
                                { type: 'text', content: 'VOCABULARIO CLAVE', style: { 'text-align': 'center', color: '#be123c', 'font-weight': '900', 'font-size': '11px', 'margin-bottom': '10px' } },
                                { style: { display: 'flex', 'justify-content': 'space-between', padding: '5px 0', 'border-bottom': '1px solid #fecaca' }, components: [{ type: 'text', content: 'Apple', style: { 'font-weight': '700' } }, { type: 'text', content: 'Manzana' }] },
                                { style: { display: 'flex', 'justify-content': 'space-between', padding: '5px 0' }, components: [{ type: 'text', content: 'Book', style: { 'font-weight': '700' } }, { type: 'text', content: 'Libro' }] }
                            ]
                        }
                    },
                    {
                        id: 'post-it-art',
                        label: '<b>Nota</b>',
                        content: {
                            style: { position: 'absolute', width: '200px', height: '200px', background: '#fef9c3', padding: '20px', border: '1px solid #fde047', 'box-shadow': '5px 5px 10px rgba(0,0,0,0.05)', display: 'flex', 'align-items': 'center', 'justify-content': 'center' },
                            components: [
                                { type: 'text', content: '¡RECORDATORIO!', style: { 'text-align': 'center', 'font-family': 'cursive', 'font-size': '20px', color: '#854d0e' } }
                            ]
                        }
                    },
                    {
                        id: 'table-compare',
                        label: '<b>Contraste</b>',
                        content: {
                            style: { position: 'absolute', width: '450px', background: '#fff', border: '1px solid #cbd5e1', 'border-radius': '8px', overflow: 'hidden' },
                            components: [
                                {
                                    style: { display: 'flex', background: '#f1f5f9', 'font-weight': '900' }, components: [
                                        { type: 'text', content: 'OPCIÓN A', style: { flex: 1, padding: '10px', 'text-align': 'center', 'border-right': '1px solid #cbd5e1' } },
                                        { type: 'text', content: 'OPCIÓN B', style: { flex: 1, padding: '10px', 'text-align': 'center' } }
                                    ]
                                },
                                {
                                    style: { display: 'flex', 'border-top': '1px solid #cbd5e1' }, components: [
                                        { type: 'text', content: 'Dato 1...', style: { flex: 1, padding: '10px', 'border-right': '1px solid #cbd5e1' } },
                                        { type: 'text', content: 'Dato 2...', style: { flex: 1, padding: '10px' } }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        id: 'speech-bubble',
                        label: '<b>Burbuja</b>',
                        content: {
                            style: { position: 'absolute', width: '220px', background: '#e0e7ff', padding: '15px', 'border-radius': '20px 20px 20px 0', border: '1px solid #c7d2fe' },
                            components: [
                                { type: 'text', content: '¡Hola! Escribe tu diálogo aquí...', style: { color: '#3730a3', 'font-weight': '600' } }
                            ]
                        }
                    },
                    {
                        id: 'grammar-formula',
                        label: '<b>Fórmula</b>',
                        content: {
                            style: { position: 'absolute', width: '400px', background: '#f1f5f9', border: '2px dashed #64748b', padding: '15px', 'border-radius': '8px', display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: '10px' },
                            components: [
                                { type: 'text', content: '[SUJETO]', style: { background: '#fff', padding: '5px 10px', border: '1px solid #e2e8f0', 'border-radius': '4px', 'font-weight': '800' } },
                                { type: 'text', content: '+', style: { 'font-weight': '900', color: '#64748b' } },
                                { type: 'text', content: '[VERBO]', style: { background: '#fff', padding: '5px 10px', border: '1px solid #e2e8f0', 'border-radius': '4px', 'font-weight': '800' } },
                                { type: 'text', content: '+', style: { 'font-weight': '900', color: '#64748b' } },
                                { type: 'text', content: '[OBJETO]', style: { background: '#fff', padding: '5px 10px', border: '1px solid #e2e8f0', 'border-radius': '4px', 'font-weight': '800' } }
                            ]
                        }
                    },
                    {
                        id: 'common-mistakes',
                        label: '<b>Errores</b>',
                        content: {
                            style: { position: 'absolute', width: '320px', background: '#fff', border: '1px solid #e2e8f0', 'border-radius': '10px', overflow: 'hidden' },
                            components: [
                                {
                                    style: { background: '#fee2e2', padding: '10px', display: 'flex', 'align-items': 'center', gap: '8px' }, components: [
                                        { type: 'text', content: '✕', style: { color: '#dc2626', 'font-weight': '900' } },
                                        { type: 'text', content: 'I have 20 years.', style: { color: '#991b1b', 'text-decoration': 'line-through' } }
                                    ]
                                },
                                {
                                    style: { background: '#dcfce7', padding: '10px', display: 'flex', 'align-items': 'center', gap: '8px' }, components: [
                                        { type: 'text', content: '✓', style: { color: '#16a34a', 'font-weight': '900' } },
                                        { type: 'text', content: 'I am 20 years old.', style: { color: '#14532d', 'font-weight': '700' } }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        id: 'did-you-know',
                        label: '<b>Sabías que?</b>',
                        content: {
                            style: { position: 'absolute', width: '300px', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '20px', 'border-radius': '20px', 'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.05)' },
                            components: [
                                { type: 'text', content: '¿SABÍAS QUE?', style: { color: '#7c3aed', 'font-weight': '900', 'font-size': '11px', 'margin-bottom': '8px' } },
                                { type: 'text', content: 'El inglés es el idioma con más palabras en el mundo. ¡Hay más de 1 millón!', style: { color: '#581c87', 'font-size': '14px', 'line-height': '1.5' } }
                            ]
                        }
                    },
                    {
                        id: 'verb-timeline',
                        label: '<b>Línea Tiempo</b>',
                        content: {
                            style: { position: 'absolute', width: '500px', padding: '20px', background: '#fff' },
                            components: [
                                {
                                    style: { width: '100%', height: '4px', background: '#cbd5e1', position: 'relative', 'margin-top': '30px' }, components: [
                                        { style: { position: 'absolute', left: '0', top: '-10px', width: '20px', height: '20px', background: '#6366f1', 'border-radius': '50%' } },
                                        { style: { position: 'absolute', left: '50%', top: '-10px', width: '20px', height: '20px', background: '#6366f1', 'border-radius': '50%' } },
                                        { style: { position: 'absolute', right: '0', top: '-10px', width: '20px', height: '20px', background: '#6366f1', 'border-radius': '50%' } }
                                    ]
                                },
                                {
                                    style: { display: 'flex', 'justify-content': 'space-between', 'margin-top': '15px' }, components: [
                                        { type: 'text', content: 'PAST', style: { 'font-weight': '900', 'font-size': '10px' } },
                                        { type: 'text', content: 'PRESENT', style: { 'font-weight': '900', 'font-size': '10px' } },
                                        { type: 'text', content: 'FUTURE', style: { 'font-weight': '900', 'font-size': '10px' } }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        id: 'proverb-card',
                        label: '<b>Refrán</b>',
                        content: {
                            style: { width: '280px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '25px', 'border-radius': '15px', color: 'white', 'text-align': 'center' },
                            components: [
                                { type: 'text', content: '"Actions speak louder than words"', style: { 'font-size': '18px', 'font-weight': '800', 'margin-bottom': '10px', color: 'white' } },
                                { type: 'text', content: 'Las acciones valen más que las palabras', style: { 'font-size': '12px', 'opacity': '0.9', color: 'white' } }
                            ]
                        }
                    },
                    {
                        id: 'audio-player',
                        label: '<b>Módulo Audio</b>',
                        content: {
                            style: { width: '300px', background: '#1e293b', padding: '15px', 'border-radius': '50px', display: 'flex', 'align-items': 'center', gap: '15px' },
                            components: [
                                { style: { width: '40px', height: '40px', background: '#6366f1', 'border-radius': '50%', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }, components: [{ type: 'text', content: '▶', style: { color: 'white', 'margin-left': '3px' } }] },
                                { style: { flex: 1, height: '4px', background: '#334155', 'border-radius': '2px' }, components: [{ style: { width: '40%', height: '100%', background: '#6366f1' } }] },
                                { type: 'text', content: '02:45', style: { color: '#94a3b8', 'font-size': '11px', 'font-weight': '700' } }
                            ]
                        }
                    },
                    {
                        id: 'fancy-separator',
                        label: '<b>Divisor Art</b>',
                        content: {
                            style: { width: '100%', display: 'flex', 'align-items': 'center', gap: '20px', padding: '20px 0' },
                            components: [
                                { style: { flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #cbd5e1)' } },
                                { type: 'text', content: '✦', style: { color: '#6366f1', 'font-size': '18px' } },
                                { style: { flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #cbd5e1)' } }
                            ]
                        }
                    },
                    {
                        id: 'checklist-pro',
                        label: '<b>Lista Ok</b>',
                        content: {
                            style: { width: '250px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', 'border-radius': '10px' },
                            components: [
                                { type: 'text', content: 'OBJETIVOS', style: { 'font-weight': '900', 'font-size': '11px', color: '#166534', 'margin-bottom': '10px' } },
                                { style: { display: 'flex', 'align-items': 'center', gap: '8px', 'margin-bottom': '5px' }, components: [{ style: { width: '16px', height: '16px', background: 'white', border: '2px solid #16a34a', 'border-radius': '4px' } }, { type: 'text', content: 'Tarea completada' }] }
                            ]
                        }
                    },
                    {
                        id: 'quote-box-art',
                        label: '<b>Cita Docente</b>',
                        content: {
                            style: { position: 'absolute', top: '20px', left: '20px', width: '350px', border: 'none', 'border-left': '4px solid #6366f1', padding: '10px 20px', background: '#f1f5f9' },
                            components: [
                                { type: 'text', content: '"La educación es el arma más poderosa para cambiar el mundo."', style: { 'font-style': 'italic', 'font-size': '18px', 'color': '#334155', 'margin-bottom': '10px' }, editable: true },
                                { type: 'text', content: '— Nelson Mandela', style: { 'font-weight': '900', 'font-size': '12px', 'color': '#6366f1' }, editable: true }
                            ]
                        }
                    },
                    {
                        id: 'transcription-box',
                        label: '<b>Guión/Audio</b>',
                        content: {
                            style: { position: 'absolute', top: '20px', left: '20px', width: '320px', background: '#fffbeb', border: '1px dashed #b45309', padding: '15px', 'border-radius': '4px' },
                            components: [
                                { type: 'text', content: '[AUDIO SCRIPT]', style: { color: '#b45309', 'font-weight': '900', 'font-size': '10px', 'margin-bottom': '5px' }, editable: true },
                                { type: 'text', content: 'Man: Hello? \nWoman: Hi John, it\'s me...', style: { 'font-family': 'monospace', 'white-space': 'pre-line' }, editable: true }
                            ]
                        }
                    }
                ]
            }
        });

        // Forced Interactive Logic
        // 1. Reset Rich Text Editor to GrapesJS Defaults
        // Using native toolbar to ensure stability and avoid overlapping issues.

        gjsEditor.on('component:add', (model: any) => {
            // ONLY the top-level dropped component gets 'absolute' positioning
            // This prevents internal elements (like table cells) from stacking on top of each other
            const parent = model.parent();
            if (parent && parent.get('type') === 'wrapper') {
                const style = model.getStyle();
                if (!style.position) {
                    model.addStyle({ position: 'absolute' });
                }
            }
        });

        gjsEditor.on('component:selected', (model) => {
            model.set('resizable', { tl: 1, tc: 1, tr: 1, cl: 1, cr: 1, bl: 1, bc: 1, br: 1 });
        });

        // Flag to track if user is editing text
        let isTextEditing = false;

        gjsEditor.on('rte:enable', () => {
            isTextEditing = true;
        });

        gjsEditor.on('rte:disable', () => {
            isTextEditing = false;
            syncChanges(); // Sync immediately after finishing text edit
        });

        // Flag to track if the editor is being destroyed
        let isDestroyed = false;

        // Auto-save logic: Sync changes to parent state automatically (DEBOUNCED)
        const syncChanges = () => {
            if (isTextEditing) return; // Skip sync if editing text
            if (isDestroyed) return; // Skip if destroying

            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

            syncTimerRef.current = setTimeout(() => {
                if (isDestroyed) return; // Double check inside timeout
                try {
                    const data = {
                        html: gjsEditor.getHtml(),
                        css: gjsEditor.getCss(),
                        project: gjsEditor.getProjectData()
                    };
                    onChangeRef.current(data);
                } catch (e) {
                    console.warn('Silent save error:', e);
                }
            }, 500); // 500ms debounce
        };

        gjsEditor.on('component:update', syncChanges);
        gjsEditor.on('component:add', syncChanges);
        gjsEditor.on('component:remove', syncChanges);
        gjsEditor.on('style:update', syncChanges);
        gjsEditor.on('canvas:drop', syncChanges);

        if (content && content.project) {
            gjsEditor.loadProjectData(content.project);
        } else if (content && typeof content === 'string' && content.startsWith('{')) {
            try {
                const parsed = JSON.parse(content);
                if (parsed.project) gjsEditor.loadProjectData(parsed.project);
            } catch (e) { }
        }

        setEditor(gjsEditor);
        return () => {
            isDestroyed = true;
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
            if (gjsEditor) {
                try {
                    // isDestroyed flag handles the safety, so we can skip manual off() if TS complains
                    gjsEditor.destroy();
                } catch (e) {
                    // Ignore destroy errors
                }
            }
        };
    }, []);

    return (
        <div className="flex flex-col bg-white border border-slate-300 shadow-2xl overflow-hidden min-h-[850px]">
            {/* Super Toolbar (Simplified) */}
            <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900">{t.gamification.editor.title}</h4>
                        <p className="text-[11px] text-slate-400 font-bold tracking-tight">{t.gamification.editor.autosave}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (editor && confirm(t.gamification.editor.confirmClear)) {
                                editor.Components.clear();
                                editor.Css.clear();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-md font-black text-xs hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t.gamification.editor.clear}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative" style={{ height: '750px' }}>
                {/* Visual Blocks Drawer */}
                <div className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xl z-40">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 bg-slate-50/50">
                            <h5 className="text-[11px] font-black text-slate-500 tracking-widest text-center">{t.gamification.editor.dragComponents}</h5>
                        </div>
                        <div id="blocks" className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-1">
                            {/* GrapesJS blocks inject here */}
                        </div>
                        <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                            <p className="text-[11px] text-indigo-700 font-bold leading-tight text-center">
                                {t.gamification.editor.doubleClickTip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* The Canvas (The Magic Paper) */}
                <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto custom-scrollbar flex justify-center">
                    <div className="w-full max-w-[850px] min-h-[1200px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.15)] relative scale-[0.98] origin-top">
                        {/* This is the GrapesJS target */}
                        <div ref={editorRef} />

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .gjs-cv-canvas { width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; }
                            .gjs-cv-canvas .gjs-highlighter { outline: 2px solid #6366f1 !important; }
                            /* Style Manager UI Fixes */
                            .gjs-sm-sector { border-bottom: 1px solid #e2e8f0 !important; }
                            .gjs-sm-title { font-weight: 800 !important; font-size: 11px !important; color: #475569 !important; }
                            .gjs-sm-property { padding: 10px 0 !important; }
                            .gjs-sm-label { font-size: 11px !important; font-weight: 600 !important; color: #64748b !important; }
                            .gjs-sm-field { background-color: #f8fafc !important; border-radius: 6px !important; border: 1px solid #e2e8f0 !important; }
                            
                            /* Toolbar RTE adjustment */
                            .gjs-rte-toolbar {
                                z-index: 100 !important;
                                border: none !important;
                                display: flex !important;
                                align-items: center !important;
                                gap: 2px !important;
                            }
                            .gjs-rte-action {
                                color: white !important;
                                fill: white !important;
                            }
                            .gjs-rte-action:hover {
                                background-color: rgba(255,255,255,0.1) !important;
                            }
                        ` }} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* GrapesJS Blocks Compact List Styling */
                .gjs-block {
                    width: 100% !important;
                    min-height: 42px !important;
                    padding: 8px 12px !important;
                    margin-bottom: 6px !important;
                    background-color: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                    display: flex !important;
                    align-items: center !important;
                    cursor: grab !important;
                    transition: all 0.2s ease !important;
                }
                .gjs-block:hover {
                    background-color: #f1f5f9 !important;
                    color: #6366f1 !important;
                    border-color: #cbd5e1 !important;
                }
                .gjs-block:active {
                    cursor: grabbing !important;
                }
                
                /* Force block names to be visible (fixing the black color issue) */
                .gjs-block-label, .gjs-block b {
                    color: #1e293b !important;
                    font-weight: 700 !important;
                }

                .gjs-editor {
                    background-color: #ffffff !important;
                }

                /* Layout adjustments to prevent expansion */
                .gjs-editor {
                    position: static !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }

                /* Essential panels hiding but keeping logic */
                .gjs-pn-panels, .gjs-pn-views-container {
                    display: none !important;
                }
            `}</style>
        </div>
    );
});
