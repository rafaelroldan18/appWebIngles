import { useState, useEffect, useRef } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Usuario } from '@/types/user.types';

interface UserMenuProps {
  usuario: Usuario;
  onSettings?: (view: 'profile' | 'settings') => void;
  onLogout: () => void;
  onViewAsStudent?: () => void;
}

export function UserMenu({ usuario, onSettings, onLogout, onViewAsStudent }: UserMenuProps) {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:opacity-80 transition-all"
      >
        <span className="hidden lg:inline text-sm text-[#334155] dark:text-gray-300 font-semibold">
          {usuario.nombre}
        </span>
        <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700">
          <span className="text-white font-bold text-sm lg:text-base">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {showMenu && (
        <div className="absolute top-12 sm:top-14 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-gray-700 w-64 sm:w-72 z-50 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#F1F5F9] dark:border-gray-700 bg-gradient-to-r from-[#F8FAFC] to-white dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1E293B] dark:text-white truncate text-sm sm:text-base">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-gray-400 truncate">
                  {usuario.correo_electronico}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            {onSettings && (
              <>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSettings('profile');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-gray-700 flex items-center gap-3 text-[#334155] dark:text-gray-300 transition-all active:scale-98 text-sm sm:text-base"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{t.userMenuProfile}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSettings('settings');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-gray-700 flex items-center gap-3 text-[#334155] dark:text-gray-300 transition-all active:scale-98 text-sm sm:text-base"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">{t.userMenuSettings}</span>
                </button>
              </>
            )}

            {onViewAsStudent && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onViewAsStudent();
                }}
                className="w-full px-4 py-3 text-left hover:bg-[#DBEAFE] dark:hover:bg-blue-900/30 flex items-center gap-3 text-[#3B82F6] dark:text-blue-400 transition-all active:scale-98 text-sm sm:text-base"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{t.userMenuViewAsStudent}</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowMenu(false);
                onLogout();
              }}
              className="w-full px-4 py-3 text-left hover:bg-[#FEE2E2] dark:hover:bg-red-900/30 flex items-center gap-3 text-[#EF4444] dark:text-red-400 transition-all active:scale-98 text-sm sm:text-base"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t.userMenuLogout}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
