import type { AccountStatus, DifficultyLevel, AssignmentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
    success: 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]',
    warning: 'bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]',
    danger: 'bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]',
    info: 'bg-[#DBEAFE] text-[#3B82F6] border-[#3B82F6]',
    purple: 'bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AccountStatus | AssignmentStatus }) {
  const getVariant = () => {
    if (status === 'activo' || status === 'completado') return 'success';
    if (status === 'pendiente' || status === 'en_curso' || status === 'en_progreso') return 'warning';
    if (status === 'inactivo') return 'default';
    return 'default';
  };

  const getLabel = () => {
    if (status === 'en_progreso' || status === 'en_curso') return 'EN PROGRESO';
    return status.toUpperCase();
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
}

export function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const variants = {
    bajo: 'success' as const,
    medio: 'warning' as const,
    alto: 'danger' as const,
  };

  return <Badge variant={variants[level]}>{level.toUpperCase()}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const getVariant = () => {
    switch (role) {
      case 'administrador':
        return 'danger';
      case 'docente':
        return 'info';
      case 'estudiante':
        return 'success';
      default:
        return 'default';
    }
  };

  return <Badge variant={getVariant()}>{role.toUpperCase()}</Badge>;
}
