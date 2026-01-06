'use client';

/**
 * Página de debug para ver qué hay en game_types
 * Acceder en: /admin/debug-game-types
 */

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DebugGameTypesPage() {
    const [gameTypes, setGameTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadGameTypes = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/games/types');
            const data = await response.json();

            if (response.ok) {
                setGameTypes(Array.isArray(data) ? data : []);
            } else {
                setError(data.error || 'Error al cargar game types');
            }
        } catch (err) {
            setError('Error de conexión: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGameTypes();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                            Debug: Game Types
                        </h1>
                        <button
                            onClick={loadGameTypes}
                            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            <p className="text-slate-600 dark:text-gray-300 mt-4">Cargando...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="mb-6">
                                <p className="text-lg font-bold text-slate-800 dark:text-white">
                                    Total de registros: {gameTypes.length}
                                </p>
                            </div>

                            {gameTypes.length === 0 ? (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center">
                                    <p className="text-yellow-800 dark:text-yellow-200 font-bold mb-2">
                                        ⚠️ La tabla game_types está vacía
                                    </p>
                                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                                        Necesitas ejecutar el seed en /admin/seed-game-types
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {gameTypes.map((gameType, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-gray-700"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
                                                        game_type_id (UUID)
                                                    </p>
                                                    <p className="font-mono text-sm text-slate-800 dark:text-white break-all">
                                                        {gameType.game_type_id}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
                                                        name
                                                    </p>
                                                    <p className="font-bold text-slate-800 dark:text-white">
                                                        {gameType.name || '(vacío)'}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
                                                        description
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-gray-300">
                                                        {gameType.description || '(vacío)'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">
                                    Valores esperados para "name":
                                </p>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• word_catcher</li>
                                    <li>• grammar_run</li>
                                    <li>• sentence_builder</li>
                                    <li>• image_match</li>
                                    <li>• city_explorer</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
