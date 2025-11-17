export function LoadingSpinner({ message = 'Cargando...', size = 'default' }: { message?: string; size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: 'w-8 h-8 border-2',
    default: 'w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4',
    large: 'w-20 h-20 border-4',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
      <div className="text-center">
        <div className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4`} />
        <p className="text-[#111827] dark:text-white font-semibold text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
}

export function InlineSpinner({ size = 'default', className = '' }: { size?: 'small' | 'default' | 'large'; className?: string }) {
  const sizes = {
    small: 'w-4 h-4 border-2',
    default: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-3',
  };

  return (
    <div className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`} />
  );
}
