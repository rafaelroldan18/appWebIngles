import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import Icon from '@/components/ui/Icon';
import LanguageSelector from '@/components/layout/LanguageSelector';

interface LoginProps {
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rol, setRol] = useState<UserRole>('estudiante');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!nombre.trim() || !apellido.trim()) {
          setError('Nombre y apellido son obligatorios');
          setLoading(false);
          return;
        }
        await signUp(email, password, nombre.trim(), apellido.trim(), rol);
        alert('Cuenta creada exitosamente. Espera la aprobación para iniciar sesión.');
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setNombre('');
        setApellido('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/images/logo.jpg" 
            alt="Unidad Educativa Delice" 
            className="w-20 h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-[#0288D1] mb-2">English27</h1>
          <p className="text-gray-600">Aprende inglés de forma divertida</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-[#4DB6E8] mb-4 transition-colors"
            >
              <Icon name="arrow-back" className="w-4 h-4" />
              Volver
            </button>
          )}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <div className="relative">
                    <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#4DB6E8] focus:outline-none transition-colors"
                      placeholder="Tu nombre"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <div className="relative">
                    <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#4DB6E8] focus:outline-none transition-colors"
                      placeholder="Tu apellido"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as UserRole)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#4DB6E8] focus:outline-none transition-colors bg-white"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#4DB6E8] focus:outline-none transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Icon name="lock-closed" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#4DB6E8] focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Procesando...'
              ) : isLogin ? (
                <>
                  <Icon name="log-in" className="w-5 h-5" />
                  Iniciar Sesión
                </>
              ) : (
                <>
                  <Icon name="person-add" className="w-5 h-5" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Desarrollado para el aprendizaje de inglés</p>
        </div>
      </div>
    </div>
  );
}
