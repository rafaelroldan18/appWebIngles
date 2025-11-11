import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AgregarUsuarioModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarUsuarioModal({ onClose, onSuccess }: AgregarUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo_electronico: '',
    password: '',
    rol: 'estudiante',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.correo_electronico,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase.from('usuarios').insert({
          auth_user_id: authData.user.id,
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo_electronico: formData.correo_electronico,
          rol: formData.rol,
          estado_cuenta: 'activo',
        });

        if (dbError) throw dbError;

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] p-6 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Agregar Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#4DB6E8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Apellido
            </label>
            <input
              type="text"
              required
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#4DB6E8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={formData.correo_electronico}
              onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#4DB6E8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#4DB6E8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#4DB6E8] focus:outline-none"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
