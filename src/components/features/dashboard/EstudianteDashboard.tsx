import { useState } from 'react';
import { Trophy, BookOpen, Award, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProgress } from '@/hooks/useProgress';
import { useStudentAssignments } from '@/hooks/useActivities';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge, DifficultyBadge, Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import LogoutModal from '@/components/ui/LogoutModal';

interface EstudianteDashboardProps {
  onLogout: () => void;
}

export default function EstudianteDashboard({ onLogout }: EstudianteDashboardProps) {
  const { usuario, signOut } = useAuth();
  const { t } = useLanguage();
  const { progress, loading: loadingProgress } = useProgress(usuario?.id_usuario);
  const { assignments, loading: loadingAssignments } = useStudentAssignments(usuario?.id_usuario);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD]">
      <DashboardNav
        usuario={usuario!}
        title="English27"
        subtitle={t('panelEstudiante')}
        onLogout={() => setShowLogoutModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0288D1] mb-2">
            {t('hola')}, {usuario?.nombre}! 👋
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{t('continuaAventura')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<Trophy className="w-6 h-6 text-white" />}
            label={t('nivel')}
            value={progress?.nivel_actual || 1}
            iconBgColor="bg-gradient-to-br from-[#4DB6E8] to-[#0288D1]"
            borderColor="border-[#4DB6E8]"
            valueColor="text-[#0288D1]"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-white" />}
            label={t('puntos')}
            value={progress?.puntaje_total || 0}
            iconBgColor="bg-gradient-to-br from-[#FFD54F] to-[#FFC107]"
            borderColor="border-[#FFD54F]"
            valueColor="text-[#FFC107]"
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-white" />}
            label={t('completadas')}
            value={progress?.actividades_completadas || 0}
            iconBgColor="bg-gradient-to-br from-[#58C47C] to-[#4CAF50]"
            borderColor="border-[#58C47C]"
            valueColor="text-[#58C47C]"
          />
          <StatCard
            icon={<Award className="w-6 h-6 text-white" />}
            label={t('recompensas')}
            value={0}
            iconBgColor="bg-gradient-to-br from-purple-400 to-purple-600"
            borderColor="border-purple-400"
            valueColor="text-purple-600"
          />
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#4DB6E8]" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#0288D1]">{t('misActividades')}</h3>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('noActividadesAsignadas')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('docenteAsignaraActividades')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((asignacion) => (
                <div
                  key={asignacion.id_asignacion}
                  className="border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#4DB6E8] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                      <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                        {asignacion.actividades.titulo}
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <StatusBadge status={asignacion.estado} />
                        <DifficultyBadge level={asignacion.actividades.nivel_dificultad} />
                        <Badge variant="info">{asignacion.actividades.tipo.toUpperCase()}</Badge>
                      </div>
                      {asignacion.fecha_limite && (
                        <p className="text-sm text-gray-500">
                          Fecha límite: {new Date(asignacion.fecha_limite).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    {asignacion.estado === 'completado' && (
                      <div className="text-left sm:text-right sm:ml-4">
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold">Puntaje</p>
                        <p className="text-xl sm:text-2xl font-bold text-[#FFD54F]">
                          {asignacion.puntaje_obtenido}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
