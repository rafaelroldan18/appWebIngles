import { Clock, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function CuentaPendiente() {
  const { signOut, usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DB6E8]/30 via-white to-[#4DB6E8]/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-yellow-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Cuenta Pendiente de Aprobación
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Tu cuenta ha sido creada exitosamente, pero está pendiente de aprobación por {usuario?.rol === 'estudiante' ? 'un docente' : 'un administrador'}.
        </p>
        
        <div className="bg-blue-50 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#4DB6E8] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 text-left">
              Recibirás una notificación cuando tu cuenta sea aprobada. Por favor, espera la confirmación antes de intentar acceder nuevamente.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="w-full bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
