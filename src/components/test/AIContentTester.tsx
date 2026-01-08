/**
 * Componente de prueba para verificar la generación de contenido con IA
 * Este componente puede ser usado temporalmente para probar la funcionalidad
 */

'use client';

import { useState } from 'react';
import { generateGameContentWithAI } from '@/lib/ai-content-generator';
import { GameTypeId } from '@/lib/game-content-contracts';

export default function AIContentTester() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const testGeneration = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await generateGameContentWithAI({
                topicId: 'test-topic-id',
                topicTitle: 'Animals',
                gameTypeId: 'word_catcher' as GameTypeId,
                count: 5,
                contextNote: 'nivel básico - principiantes'
            });

            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                    🧪 Probador de Generación de Contenido con IA
                </h2>

                <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Este componente prueba la conexión con Gemini AI.
                    Genera 5 palabras sobre "Animals" para Word Catcher.
                </p>

                <button
                    onClick={testGeneration}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Generando...' : '🚀 Probar Generación con IA'}
                </button>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
                        <p className="text-red-600 dark:text-red-400 font-bold">❌ Error:</p>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl">
                            <p className="text-green-600 dark:text-green-400 font-bold">
                                ✅ Generación exitosa: {result.count} elementos
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-gray-700">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                                Contenido Generado:
                            </h3>
                            <div className="space-y-3">
                                {result.content.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">
                                                    {item.content_text}
                                                </p>
                                                {item.metadata?.translation && (
                                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                                        {item.metadata.translation}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.is_correct
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {item.is_correct ? '✓ Correcta' : '✗ Distractor'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <details className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-gray-700">
                            <summary className="font-bold text-slate-700 dark:text-gray-300 cursor-pointer">
                                📄 Ver JSON completo
                            </summary>
                            <pre className="mt-4 p-4 bg-slate-900 text-green-400 rounded-xl overflow-x-auto text-xs">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">
                    ℹ️ Información
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Asegúrate de tener GEMINI_API_KEY configurada en .env</li>
                    <li>• El servidor debe estar reiniciado después de agregar la clave</li>
                    <li>• Este componente es solo para pruebas, no para producción</li>
                </ul>
            </div>
        </div>
    );
}
