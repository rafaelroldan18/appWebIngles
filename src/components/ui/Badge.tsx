import type { AccountStatus, DifficultyLevel, AssignmentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-info/10 text-info border-info/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-info/10 text-info border-info/20',
    purple: 'bg-secondary/10 text-secondary border-secondary/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AccountStatus | AssignmentStatus }) {
  const getVariant = () => {
    if (status === 'activo' || status === 'completado') return 'success';
    if (status === 'pendiente' || status === 'en_curso') return 'info';
    if (status === 'inactivo') return 'default';
    return 'default';
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const getLabel = () => {
    if (status === 'en_curso') return 'En curso';
    return capitalize(status);
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
}

export function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const variants = {
    bajo: 'success' as const,
    medio: 'info' as const,
    alto: 'danger' as const,
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return <Badge variant={variants[level]}>{capitalize(level)}</Badge>;
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

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return <Badge variant={getVariant()}>{capitalize(role)}</Badge>;
}
