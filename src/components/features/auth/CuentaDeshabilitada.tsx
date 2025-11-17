import { XCircle, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '@/config/colors';

export default function CuentaDeshabilitada() {
  const { signOut } = useAuth();

  return (
    <div className={`min-h-screen ${colors.background.base} flex items-center justify-center px-4 sm:px-6`}>
      <div className={`max-w-md w-full ${colors.background.card} rounded-2xl shadow-lg border ${colors.border.light} p-6 sm:p-8 text-center`}>
        <div className={`w-16 h-16 sm:w-20 sm:h-20 ${colors.status.error.bg} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
          <XCircle className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.status.error.text}`} />
        </div>
        
        <h1 className={`text-2xl sm:text-3xl font-bold ${colors.text.title} mb-3 sm:mb-4`}>
          Cuenta Deshabilitada
        </h1>
        
        <p className={`text-sm sm:text-base ${colors.text.secondary} mb-4 sm:mb-6 leading-relaxed`}>
          Tu cuenta ha sido deshabilitada temporalmente. No puedes acceder a las funcionalidades del sistema en este momento.
        </p>
        
        <div className={`${colors.status.info.bg} ${colors.status.info.border} rounded-xl p-4 mb-4 sm:mb-6`}>
          <div className="flex items-start gap-3">
            <Mail className={`w-5 h-5 ${colors.status.info.text} mt-0.5 flex-shrink-0`} />
            <p className={`text-sm ${colors.text.primary} text-left`}>
              Si crees que esto es un error, por favor contacta al administrador del sistema para más información.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className={`w-full bg-gradient-to-r ${colors.primary.gradient} hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all active:scale-98`}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
