'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StudentProgress {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  puntaje_total: number;
  nivel_actual: number;
  actividades_completadas: number;
  misiones_completadas: number;
  racha_actual: number;
  racha_maxima: number;
  insignias_ganadas: number;
  ultima_actividad: string | null;
  fecha_registro: string;
}

export default function StudentProgressView() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'puntaje' | 'nivel' | 'misiones'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/gamification/student-progress');

      if (!response.ok) {
        throw new Error('Error al cargar el progreso');
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedStudents = students
    .filter(student => {
      const searchLower = searchTerm.toLowerCase();
      return (
        student.nombre.toLowerCase().includes(searchLower) ||
        student.apellido.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'nombre':
          compareValue = `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
          break;
        case 'puntaje':
          compareValue = a.puntaje_total - b.puntaje_total;
          break;
        case 'nivel':
          compareValue = a.nivel_actual - b.nivel_actual;
          break;
        case 'misiones':
          compareValue = a.misiones_completadas - b.misiones_completadas;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field: 'nombre' | 'puntaje' | 'nivel' | 'misiones') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando progreso de estudiantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
          >
            <span>←</span> Volver
          </button>

          <h1 className="text-4xl font-bold text-[#1F2937] dark:text-white mb-2">
            Progreso de Estudiantes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitorea el rendimiento y participación de tus estudiantes
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#475569] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-[#475569] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              >
                <option value="nombre">Nombre</option>
                <option value="puntaje">Puntaje</option>
                <option value="nivel">Nivel</option>
                <option value="misiones">Misiones</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-gray-200 dark:bg-[#334155] text-[#1F2937] dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-[#475569] transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold mb-1">
                Total Estudiantes
              </div>
              <div className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {students.length}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
              <div className="text-green-600 dark:text-green-400 text-sm font-semibold mb-1">
                Promedio Puntos
              </div>
              <div className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {Math.round(students.reduce((acc, s) => acc + s.puntaje_total, 0) / students.length || 0)}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
              <div className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold mb-1">
                Promedio Nivel
              </div>
              <div className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {(students.reduce((acc, s) => acc + s.nivel_actual, 0) / students.length || 0).toFixed(1)}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
              <div className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">
                Total Misiones
              </div>
              <div className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {students.reduce((acc, s) => acc + s.misiones_completadas, 0)}
              </div>
            </div>
          </div>

          {filteredAndSortedStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-[#334155]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estudiante
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nivel
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Puntos
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Misiones
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Racha
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Insignias
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Última Actividad
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155]/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                            {getInitials(student.nombre, student.apellido)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1F2937] dark:text-white">
                              {student.nombre} {student.apellido}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                          {student.nivel_actual}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-[#1F2937] dark:text-white">
                        {student.puntaje_total.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm">
                          <span>✓</span>
                          {student.misiones_completadas}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold text-sm">
                          <span>🔥</span>
                          {student.racha_actual}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-semibold text-sm">
                          <span>🏆</span>
                          {student.insignias_ganadas}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(student.ultima_actividad)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => router.push(`/docente/gamification/student-progress/${student.id}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
