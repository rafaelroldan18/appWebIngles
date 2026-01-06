'use client';

/**
 * Página de administración para inicializar game_types
 * Acceder en: /admin/seed-game-types
 */

import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SeedGameTypesPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [data, setData] = useState<any>(null);

    const handleSeed = async () => {
        setStatus('loading');
        setMessage('');
        setData(null);

        try {
            const response = await fetch('/api/games/types/seed', {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(result.message);
                setData(result.data || result.existing);
            } else {
                setStatus('error');
                setMessage(result.error || 'Error al inicializar game types');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error de conexión: ' + (error as Error).message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        Inicializar Game Types
                    </h1>
                    <p className="text-slate-600 dark:text-gray-300">
                        Este proceso crea los 5 tipos de juegos en la base de datos
                    </p>
                </div>

                {/* Game Types List */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        Tipos de Juegos a Crear:
                    </h2>
                    <ul className="space-y-2">
                        {[
                            { name: 'word_catcher', desc: 'Catch falling words - vocabulary practice' },
                            { name: 'grammar_run', desc: 'Run and choose correct grammar options' },
                            { name: 'sentence_builder', desc: 'Build sentences by arranging words' },
                            { name: 'image_match', desc: 'Match images with their words' },
                            { name: 'city_explorer', desc: 'Explore the city and learn locations' }
                        ].map((game) => (
                            <li key={game.name} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {game.name}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-gray-400">
                                        {game.desc}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSeed}
                    disabled={status === 'loading'}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                >
                    {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
                    {status === 'loading' ? 'Inicializando...' : 'Inicializar Game Types'}
                </button>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h3 className="font-bold text-green-800 dark:text-green-200">
                                ¡Éxito!
                            </h3>
                        </div>
                        <p className="text-green-700 dark:text-green-300 mb-3">
                            {message}
                        </p>
                        {data && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
                                <p className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                                    Game Types Creados:
                                </p>
                                <ul className="space-y-1">
                                    {data.map((item: any, idx: number) => (
                                        <li key={idx} className="text-sm text-slate-600 dark:text-gray-400">
                                            • {item.name || item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <h3 className="font-bold text-red-800 dark:text-red-200">
                                Error
                            </h3>
                        </div>
                        <p className="text-red-700 dark:text-red-300">
                            {message}
                        </p>
                    </div>
                )}

                {/* Info */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Nota:</strong> Este proceso solo necesita ejecutarse una vez.
                        Si los game types ya existen, recibirás un mensaje indicándolo.
                    </p>
                </div>
            </div>
        </div>
    );
}
