import { UserMenu } from './UserMenu';
import type { Usuario } from '@/types/user.types';

interface DashboardNavProps {
  usuario: Usuario;
  title: string;
  subtitle: string;
  onLogout: () => void;
  onSettings?: (view: 'profile' | 'settings') => void;
}

export function DashboardNav({ usuario, title, subtitle, onLogout, onSettings }: DashboardNavProps) {

  return (
    <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <button 
          onClick={onSettings ? () => onSettings('dashboard' as any) : undefined}
          className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity"
        >
          <img 
            src="/images/logo.jpg" 
            alt="Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
          />
          <div className="text-left">
            <h1 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{title}</h1>
            <p className="hidden sm:block text-sm text-[#6B7280] dark:text-[#E5E7EB]">{subtitle}</p>
          </div>
        </button>
        
        <UserMenu usuario={usuario} onProfile={onSettings ? () => onSettings('profile') : undefined} onSettings={onSettings ? () => onSettings('settings') : undefined} onLogout={onLogout} />
      </div>
    </nav>
  );
}
