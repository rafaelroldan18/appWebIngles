import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Mail, Calendar, Shield, IdCard, Award, Star } from 'lucide-react';
import { colors } from '@/config/colors';

interface ProfilePageProps {
  onBack?: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { usuario } = useAuth();
  const { t } = useLanguage();

  const getRolColor = () => {
    switch (usuario?.rol) {
      case 'administrador': return colors.accent.danger.gradient;
      case 'docente': return colors.accent.info.gradient;
      default: return colors.accent.success.gradient;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Regresar al dashboard"
            className={`w-10 h-10 ${colors.background.card} ${colors.border.light} hover:${colors.background.hover} hover:border-blue-400 dark:hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90`}
          >
            <ArrowLeft className={`w-5 h-5 ${colors.text.secondary}`} aria-hidden="true" />
          </button>
        )}
        <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${colors.text.title}`}>{t.profile.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className={`${colors.background.card} rounded-2xl shadow-lg p-4 sm:p-6 text-center`}>
            <div className="relative inline-block mb-4">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${colors.primary.gradient} rounded-full flex items-center justify-center shadow-xl`}>
                <span className="text-white font-bold text-3xl sm:text-4xl">
                  {usuario?.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br ${colors.secondary.gradient} rounded-full flex items-center justify-center border-4 ${colors.background.card} shadow-lg`}>
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>

            <h2 className={`text-lg sm:text-xl font-bold ${colors.text.title} mb-1`}>
              {usuario?.nombre} {usuario?.apellido}
            </h2>

            <span className={`inline-block px-4 py-2 bg-gradient-to-r ${getRolColor()} text-white rounded-full text-sm font-bold shadow-md mb-4`}>
              {t.roles[usuario?.rol as keyof typeof t.roles]?.toUpperCase() || usuario?.rol.toUpperCase()}
            </span>

            <div className={`mt-6 pt-6 border-t-2 ${colors.border.light}`}>
              <div className={`flex items-center justify-center gap-2 ${colors.text.secondary}`}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{t.profile.memberSince}</span>
              </div>
              <p className={`${colors.text.primary} font-semibold mt-1 text-sm`}>
                {new Date(usuario?.fecha_registro || '').toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className={`${colors.background.card} rounded-2xl shadow-lg p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 bg-gradient-to-br ${colors.primary.gradient} rounded-lg flex items-center justify-center`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-lg font-bold ${colors.text.title}`}>{t.profile.personalInfo}</h3>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${colors.primary.gradient} bg-opacity-10 rounded-xl border-l-4 ${colors.primary.border}`}>
                <div className={`w-12 h-12 ${colors.background.base} rounded-lg flex items-center justify-center shadow-sm`}>
                  <Mail className={`w-6 h-6 ${colors.primary.main}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${colors.text.secondary} font-semibold uppercase tracking-wide`}>{t.profile.email}</p>
                  <p className={`${colors.text.primary} font-semibold text-sm`}>{usuario?.correo_electronico}</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${colors.secondary.gradient} bg-opacity-10 rounded-xl border-l-4 ${colors.secondary.border}`}>
                <div className={`w-12 h-12 ${colors.background.base} rounded-lg flex items-center justify-center shadow-sm`}>
                  <IdCard className={`w-6 h-6 ${colors.secondary.main}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${colors.text.secondary} font-semibold uppercase tracking-wide`}>{t.profile.idCard}</p>
                  <p className={`${colors.text.primary} font-semibold text-sm`}>{usuario?.cedula}</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${colors.status.neutral.bg} rounded-xl border-l-4 ${colors.status.neutral.border}`}>
                <div className={`w-12 h-12 ${colors.background.base} rounded-lg flex items-center justify-center shadow-sm`}>
                  <Shield className={`w-6 h-6 ${colors.text.secondary}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${colors.text.secondary} font-semibold uppercase tracking-wide`}>{t.profile.accountStatus}</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${usuario?.estado_cuenta === 'activo'
                      ? `${colors.status.success.bg} ${colors.status.success.text}`
                      : usuario?.estado_cuenta === 'pendiente'
                        ? `${colors.status.info.bg} ${colors.status.info.text}`
                        : `${colors.status.neutral.bg} ${colors.status.neutral.text}`
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

