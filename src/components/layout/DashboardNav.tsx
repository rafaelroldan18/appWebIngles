import { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import type { Usuario } from '@/types';

interface DashboardNavProps {
  usuario: Usuario;
  title: string;
  subtitle: string;
  onLogout: () => void;
}

export function DashboardNav({ usuario, title, subtitle, onLogout }: DashboardNavProps) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleClick = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  return (
    <nav className="bg-white shadow-md border-b-4 border-[#4DB6E8]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src="/images/logo.jpg" 
            alt="Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#0288D1]">{title}</h1>
            <p className="hidden sm:block text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 relative">
          <span className="hidden md:inline text-sm text-gray-700 font-semibold">{usuario.nombre}</span>
          <div className="w-10 h-10 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute top-14 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-50">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
