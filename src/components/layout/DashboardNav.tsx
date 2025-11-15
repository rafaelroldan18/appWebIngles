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
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b-4 border-[#3B82F6] dark:border-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src="/images/logo.jpg" 
            alt="Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain rounded-lg"
          />
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#1E293B] dark:text-white">{title}</h1>
            <p className="hidden sm:block text-sm md:text-base lg:text-lg text-[#64748B] dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        
        <UserMenu usuario={usuario} onProfile={onSettings ? () => onSettings('profile') : undefined} onSettings={onSettings ? () => onSettings('settings') : undefined} onLogout={onLogout} />
      </div>
    </nav>
  );
}
