'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Save, RotateCcw, Award, Clock, Target, Zap } from 'lucide-react';

interface TeacherSettings {
  default_points_quiz: number;
  default_points_matching: number;
  default_points_fill_blank: number;
  default_time_limit: number;
  default_difficulty: string;
  auto_approve_students: boolean;
  allow_retries: boolean;
  max_retries: number;
}

export function SettingsTeacherView() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [settings, setSettings] = useState<TeacherSettings>({
    default_points_quiz: 100,
    default_points_matching: 80,
    default_points_fill_blank: 90,
    default_time_limit: 300,
    default_difficulty: 'medio',
    auto_approve_students: false,
    allow_retries: true,
    max_retries: 3
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      localStorage.setItem(`teacher_settings_${usuario?.user_id}`, JSON.stringify(settings));

      setMessage({
        type: 'success',
        text: 'Configuración guardada exitosamente'
      });

      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al guardar la configuración'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm('¿Estás seguro de que deseas restaurar los valores por defecto?')) {
      return;
    }

    setSettings({
      default_points_quiz: 100,
      default_points_matching: 80,
      default_points_fill_blank: 90,
      default_time_limit: 300,
      default_difficulty: 'medio',
      auto_approve_students: false,
      allow_retries: true,
      max_retries: 3
    });

    setMessage({
      type: 'success',
      text: 'Configuración restaurada a valores por defecto'
    });

    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem(`teacher_settings_${usuario?.user_id}`);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [usuario?.user_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                Configuración de Actividades
              </h1>
            </div>
            <button
              onClick={() => router.push('/docente/gamification')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
                Puntos por Defecto
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configura los puntos predeterminados para cada tipo de actividad
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cuestionarios (Quiz)
              </label>
              <input
                type="number"
                value={settings.default_points_quiz}
                onChange={(e) => setSettings({ ...settings, default_points_quiz: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emparejamiento (Matching)
              </label>
              <input
                type="number"
                value={settings.default_points_matching}
                onChange={(e) => setSettings({ ...settings, default_points_matching: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rellenar Espacios (Fill in the Blank)
              </label>
              <input
                type="number"
                value={settings.default_points_fill_blank}
                onChange={(e) => setSettings({ ...settings, default_points_fill_blank: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="10"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
                Tiempo y Dificultad
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configura el tiempo límite y la dificultad predeterminada
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo Límite por Defecto (segundos)
              </label>
              <input
                type="number"
                value={settings.default_time_limit}
                onChange={(e) => setSettings({ ...settings, default_time_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                min="0"
                step="30"
              />
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {Math.floor(settings.default_time_limit / 60)} minutos {settings.default_time_limit % 60} segundos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dificultad Predeterminada
              </label>
              <select
                value={settings.default_difficulty}
                onChange={(e) => setSettings({ ...settings, default_difficulty: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
                Opciones de Reintentos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configura si los estudiantes pueden reintentar las actividades
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F172A] rounded-lg">
              <div>
                <p className="font-medium text-[#1F2937] dark:text-white">
                  Permitir Reintentos
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los estudiantes pueden volver a intentar las actividades
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allow_retries: !settings.allow_retries })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.allow_retries
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.allow_retries ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {settings.allow_retries && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número Máximo de Reintentos
                </label>
                <input
                  type="number"
                  value={settings.max_retries}
                  onChange={(e) => setSettings({ ...settings, max_retries: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Restaurar Valores
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
            ℹ️ Nota Importante
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Estos valores se aplicarán por defecto al crear nuevas misiones y actividades.
            Siempre puedes modificarlos individualmente para cada actividad específica.
          </p>
        </div>
      </div>
    </div>
  );
}
