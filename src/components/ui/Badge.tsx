import type { AccountStatus, DifficultyLevel, AssignmentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AccountStatus | AssignmentStatus }) {
  const getVariant = () => {
    if (status === 'activo' || status === 'completado') return 'success';
    if (status === 'pendiente' || status === 'en_curso') return 'warning';
    return 'default';
  };

  return <Badge variant={getVariant()}>{status.toUpperCase()}</Badge>;
}

export function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const variants = {
    bajo: 'success' as const,
    medio: 'warning' as const,
    alto: 'danger' as const,
  };

  return <Badge variant={variants[level]}>{level.toUpperCase()}</Badge>;
}
