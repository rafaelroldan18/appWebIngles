'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Mail, Calendar, Shield, IdCard, Award, Star } from 'lucide-react';

interface ProfilePageProps {
  onBack?: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { usuario } = useAuth();
  const { t } = useLanguage();

  const getRolColor = () => {
    switch (usuario?.rol) {
      case 'administrador': return 'from-red-500 to-red-600';
      case 'docente': return 'from-blue-500 to-blue-600';
      default: return 'from-green-500 to-green-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-3xl font-bold text-[#0288D1] dark:text-blue-400">{t.profile.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-full flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-5xl">
                  {usuario?.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            
            <span className={`inline-block px-4 py-2 bg-gradient-to-r ${getRolColor()} text-white rounded-full text-sm font-bold shadow-md mb-4`}>
              {t.roles[usuario?.rol as keyof typeof t.roles]?.toUpperCase() || usuario?.rol.toUpperCase()}
            </span>

            <div className="mt-6 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{t.profile.memberSince}</span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 font-semibold mt-1">
                {new Date(usuario?.fecha_registro || '').toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.profile.personalInfo}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl border-l-4 border-blue-500">
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">{t.profile.email}</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">{usuario?.correo_electronico}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-900/30 dark:to-green-900/20 rounded-xl border-l-4 border-green-500">
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                  <IdCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">{t.profile.idCard}</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg">{usuario?.cedula}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-900/30 dark:to-purple-900/20 rounded-xl border-l-4 border-purple-500">
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide">{t.profile.accountStatus}</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    usuario?.estado_cuenta === 'activo' 
                      ? 'bg-green-500 text-white' 
                      : usuario?.estado_cuenta === 'pendiente'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {t.status[usuario?.estado_cuenta as keyof typeof t.status]?.toUpperCase() || usuario?.estado_cuenta.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
