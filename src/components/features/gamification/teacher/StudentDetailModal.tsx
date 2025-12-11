'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, Target, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StudentDetailModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

interface StudentDetail {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    totalPoints: number;
    level: number;
    missionsCompleted: number;
    activitiesCompleted: number;
}

interface MissionProgress {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    activitiesCompleted: number;
    totalActivities: number;
    pointsEarned: number;
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercentage: number;
    lastActivityAt: string | null;
}

export function StudentDetailModal({ studentId, studentName, onClose }: StudentDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
    const [missions, setMissions] = useState<MissionProgress[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStudentDetail();
    }, [studentId]);

    async function loadStudentDetail() {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 [StudentDetailModal] Cargando detalle del estudiante:', studentId);

            const response = await fetch(`/api/gamification/progress/student/${studentId}`);

            if (!response.ok) {
                throw new Error('Error al cargar el detalle del estudiante');
            }

            const data = await response.json();
            console.log('📊 [StudentDetailModal] Datos recibidos:', data);

            if (data.success) {
                setStudentDetail(data.student);
                setMissions(data.missions);
            } else {
                setError('No se pudo cargar la información del estudiante');
            }
        } catch (err) {
            console.error('❌ [StudentDetailModal] Error:', err);
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'facil':
                return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            case 'medio':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
            case 'dificil':
                return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'in_progress':
                return 'bg-blue-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completada';
            case 'in_progress':
                return 'En Progreso';
            default:
                return 'No Iniciada';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const pointsToNextLevel = studentDetail ? (studentDetail.level * 100) - studentDetail.totalPoints : 0;
    const levelProgress = studentDetail ? (studentDetail.totalPoints % 100) : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Detalle del Estudiante
                            </h2>
                            <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">
                                {studentName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar modal"
                            className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-90"
                        >
                            <X className="w-6 h-6 text-white" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <LoadingSpinner message="Cargando detalles..." size="large" />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                                <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
                            </div>
                        ) : studentDetail ? (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Nivel */}
                                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold opacity-90">Nivel Actual</span>
                                            <Trophy className="w-6 h-6" aria-hidden="true" />
                                        </div>
                                        <p className="text-4xl font-bold mb-2">{studentDetail.level}</p>
                                        <div className="mt-2">
                                            <div className="w-full bg-white/30 rounded-full h-2">
                                                <div
                                                    className="bg-white h-2 rounded-full transition-all"
                                                    style={{ width: `${levelProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs opacity-75 mt-1">
                                                {pointsToNextLevel} pts para nivel {studentDetail.level + 1}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Puntos Totales */}
                                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold opacity-90">Puntos Totales</span>
                                            <TrendingUp className="w-6 h-6" aria-hidden="true" />
                                        </div>
                                        <p className="text-4xl font-bold">{studentDetail.totalPoints}</p>
                                        <p className="text-sm opacity-75 mt-2">Acumulados</p>
                                    </div>

                                    {/* Misiones Completadas */}
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold opacity-90">Misiones</span>
                                            <Target className="w-6 h-6" aria-hidden="true" />
                                        </div>
                                        <p className="text-4xl font-bold">{studentDetail.missionsCompleted}</p>
                                        <p className="text-sm opacity-75 mt-2">Completadas</p>
                                    </div>

                                    {/* Actividades Completadas */}
                                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold opacity-90">Actividades</span>
                                            <CheckCircle className="w-6 h-6" aria-hidden="true" />
                                        </div>
                                        <p className="text-4xl font-bold">{studentDetail.activitiesCompleted}</p>
                                        <p className="text-sm opacity-75 mt-2">Completadas</p>
                                    </div>
                                </div>

                                {/* Missions Progress */}
                                <div className="bg-white dark:bg-[#0F172A] rounded-xl border-2 border-gray-200 dark:border-[#334155] p-6">
                                    <h3 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
                                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                        Progreso por Misión
                                    </h3>

                                    <div className="space-y-4">
                                        {missions.map((mission) => (
                                            <div
                                                key={mission.id}
                                                className={`p-5 rounded-lg border-2 transition-all ${mission.status === 'completed'
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                        : mission.status === 'in_progress'
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                                            : 'bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="text-lg font-bold text-[#1F2937] dark:text-white">
                                                                {mission.title}
                                                            </h4>
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(
                                                                    mission.status
                                                                )}`}
                                                            >
                                                                {getStatusText(mission.status)}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(mission.difficulty_level)}`}>
                                                                {mission.difficulty_level === 'facil' ? 'Fácil' : mission.difficulty_level === 'medio' ? 'Medio' : 'Difícil'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            {mission.description}
                                                        </p>
                                                        {mission.lastActivityAt && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                                                <span>Última actividad: {formatDate(mission.lastActivityAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                                            {mission.pointsEarned}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">puntos</p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                            Actividades: {mission.activitiesCompleted} / {mission.totalActivities}
                                                        </span>
                                                        <span className="text-gray-700 dark:text-gray-300 font-bold">
                                                            {mission.progressPercentage}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                        <div
                                                            className={`h-3 rounded-full transition-all ${mission.status === 'completed'
                                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                    : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                                                                }`}
                                                            style={{ width: `${mission.progressPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {missions.length === 0 && (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    No hay misiones disponibles
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
