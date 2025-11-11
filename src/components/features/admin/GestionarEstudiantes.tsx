import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Users, X, Mail, Calendar, CheckCircle, XCircle, ToggleLeft, ToggleRight, Trash2, UserPlus } from 'lucide-react';

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  estado_cuenta: string;
  fecha_registro: string;
}

interface GestionarEstudiantesProps {
  onClose: () => void;
}

export default function GestionarEstudiantes({ onClose }: GestionarEstudiantesProps) {
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo_electronico: '',
    password: '',
  });

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'estudiante')
      .order('fecha_registro', { ascending: false });

    if (data) {
      setEstudiantes(data);
    }
    setLoading(false);
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await supabase
      .from('usuarios')
      .update({ estado_cuenta: newStatus })
      .eq('id_usuario', userId);
    loadEstudiantes();
  };

  const deleteStudent = async (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
      const { error } = await supabase.rpc('delete_user_completely', { user_id: userId });
      if (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar estudiante');
      }
      loadEstudiantes();
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.correo_electronico,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase.from('usuarios').insert({
          auth_user_id: authData.user.id,
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo_electronico: formData.correo_electronico,
          rol: 'estudiante',
          estado_cuenta: 'pendiente',
        });

        setShowAddModal(false);
        setFormData({ nombre: '', apellido: '', correo_electronico: '', password: '' });
        loadEstudiantes();
      }
    } catch (err) {
      alert('Error al crear estudiante');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Gestionar Estudiantes</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Agregar</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[#4DB6E8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando estudiantes...</p>
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay estudiantes registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estudiantes.map((estudiante) => (
                <div
                  key={estudiante.id_usuario}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#4DB6E8] hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">
                        {estudiante.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {estudiante.nombre} {estudiante.apellido}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-[#4DB6E8]" />
                          <span>{estudiante.correo_electronico}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-[#4DB6E8]" />
                          <span>
                            Registrado: {new Date(estudiante.fecha_registro).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {estudiante.estado_cuenta === 'activo' ? (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              ACTIVO
                            </span>
                          ) : estudiante.estado_cuenta === 'pendiente' ? (
                            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                              <XCircle className="w-3 h-3" />
                              PENDIENTE
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                              <XCircle className="w-3 h-3" />
                              INACTIVO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {estudiante.estado_cuenta === 'pendiente' ? (
                            <button
                              onClick={async () => {
                                await supabase.from('usuarios').update({ estado_cuenta: 'activo' }).eq('id_usuario', estudiante.id_usuario);
                                loadEstudiantes();
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                            >
                              Aprobar
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleStatus(estudiante.id_usuario, estudiante.estado_cuenta)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={estudiante.estado_cuenta === 'activo' ? 'Desactivar' : 'Activar'}
                            >
                              {estudiante.estado_cuenta === 'activo' ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteStudent(estudiante.id_usuario)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-[#58C47C] to-[#4CAF50] p-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Agregar Estudiante</h3>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#58C47C] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Apellido"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#58C47C] focus:outline-none"
              />
              <input
                type="email"
                placeholder="Correo Electrónico"
                required
                value={formData.correo_electronico}
                onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#58C47C] focus:outline-none"
              />
              <input
                type="password"
                placeholder="Contraseña"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#58C47C] focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#58C47C] to-[#4CAF50] text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
