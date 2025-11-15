import { Clock, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function CuentaPendiente() {
  const { signOut, usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">
          Cuenta Pendiente de Aprobación
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
          Tu cuenta ha sido creada exitosamente, pero está pendiente de aprobación por {usuario?.rol === 'estudiante' ? 'un docente' : 'un administrador'}.
        </p>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700 text-left">
              Recibirás una notificación cuando tu cuenta sea aprobada. Por favor, espera la confirmación antes de intentar acceder nuevamente.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all active:scale-98"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
