'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StudentDetailModal } from './StudentDetailModal';

interface StudentProgress {
  id: string;
  nombre: string;
  email: string;
  totalPoints: number;
  level: number;
  missionsCompleted: number;
  activitiesCompleted: number;
}

export default function StudentProgressView() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');

  useEffect(() => {
    loadStudentsProgress();
  }, []);

  async function loadStudentsProgress() {
    try {
      console.log('👨‍🏫 [TeacherProgress] Cargando progreso de estudiantes mediante API REST...');

      // Llamar a la API para obtener el progreso de todos los estudiantes
      const response = await fetch('/api/gamification/student-progress');

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ [TeacherProgress] No autorizado');
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          console.error('❌ [TeacherProgress] Sin permisos');
          return;
        }
        throw new Error('Error al obtener progreso de estudiantes');
      }

      const data = await response.json();
      console.log('👨‍🏫 [TeacherProgress] Datos recibidos:', data);

      if (data.success && data.students) {
        // Mapear los datos de la API al formato del componente
        const studentsWithProgress = data.students.map((student: any) => ({
          id: student.id,
          nombre: `${student.nombre} ${student.apellido}`,
          email: student.email,
          totalPoints: student.puntaje_total,
          level: student.nivel_actual,
          missionsCompleted: student.misiones_completadas,
          activitiesCompleted: student.actividades_completadas,
        }));

        console.log('👨‍🏫 [TeacherProgress] Estudiantes procesados:', studentsWithProgress.length);
        setStudents(studentsWithProgress);
      } else {
        console.log('⚠️ [TeacherProgress] No se encontraron estudiantes');
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ [TeacherProgress] Error loading students progress:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner message="Cargando progreso de estudiantes..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/docente/gamification')}
              aria-label="Regresar al dashboard de gamificación"
              className="w-10 h-10 bg-white dark:bg-[#1E293B] border-2 border-gray-200 dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-[#334155] hover:border-blue-400 dark:hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-[#1F2937] dark:text-white">
                Progreso de Estudiantes
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Monitorea el avance de tus estudiantes en las actividades de gamificación
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Total Estudiantes</span>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold">{students.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Promedio de Puntos</span>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-4xl font-bold">
              {students.length > 0
                ? Math.round(
                  students.reduce((sum, s) => sum + s.totalPoints, 0) / students.length
                )
                : 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Promedio de Nivel</span>
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-4xl font-bold">
              {students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + s.level, 0) / students.length)
                : 1}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Misiones Completadas</span>
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-4xl font-bold">
              {students.reduce((sum, s) => sum + s.missionsCompleted, 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar estudiante por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1F2937] dark:text-white focus:border-blue-500 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border-2 border-gray-200 dark:border-[#334155] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0F172A] border-b-2 border-gray-200 dark:border-[#334155]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                    Estudiante
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    Nivel
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    Puntos Totales
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    Misiones Completadas
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    Actividades Completadas
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#334155]">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[#1F2937] dark:text-white">
                          {student.nombre}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold text-lg">
                        {student.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold">
                        <span>{student.totalPoints}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold">
                        <span>{student.missionsCompleted}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">
                        <span>{student.activitiesCompleted}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setSelectedStudentName(student.nombre);
                        }}
                        aria-label={`Ver detalle de ${student.nombre}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95 transition-all"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchTerm
                    ? 'No se encontraron estudiantes con ese criterio'
                    : 'No hay estudiantes registrados'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          onClose={() => {
            setSelectedStudentId(null);
            setSelectedStudentName('');
          }}
        />
      )}
    </div>
  );
}
