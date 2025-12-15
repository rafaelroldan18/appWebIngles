import { useState, useEffect, useRef } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Usuario } from '@/types/user.types';

interface UserMenuProps {
  usuario: Usuario;
  onLogout: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onViewAsStudent?: () => void;
}

export function UserMenu({ usuario, onLogout, onProfile, onSettings, onViewAsStudent }: UserMenuProps) {
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
        <span className="hidden lg:inline text-sm text-[#6B7280] dark:text-[#E5E7EB] font-semibold">
          {usuario.first_name}
        </span>
        <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#334155]">
          <span className="text-white font-bold text-sm lg:text-base">
            {usuario.first_name.charAt(0).toUpperCase()}
          </span>
        </div>
      </button>

      {showMenu && (
        <div className="absolute top-12 sm:top-14 right-0 bg-white dark:bg-[#1E293B] rounded-lg shadow-2xl border border-neutral-200 dark:border-[#334155] w-64 sm:w-72 z-50 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-[#334155] bg-gradient-to-r from-neutral-100 to-white dark:from-[#334155] dark:to-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {usuario.first_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#111827] dark:text-white truncate text-sm sm:text-base">
                  {usuario.first_name} {usuario.last_name}
                </p>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#E5E7EB] truncate">
                  {usuario.email}
                </p>
              </div>
            </div>
          </div>

          <div className="py-1">
            {onProfile && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onProfile();
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-[#334155] flex items-center gap-3 text-[#6B7280] dark:text-[#E5E7EB] transition-all text-sm"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{t.userMenuProfile}</span>
              </button>
            )}

            {onSettings && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onSettings();
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-[#334155] flex items-center gap-3 text-[#6B7280] dark:text-[#E5E7EB] transition-all text-sm"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{t.userMenuSettings}</span>
              </button>
            )}

            {onViewAsStudent && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onViewAsStudent();
                }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-[#334155] flex items-center gap-3 text-[#6B7280] dark:text-[#E5E7EB] transition-all text-sm"
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
              className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-[#334155] flex items-center gap-3 text-[#6B7280] dark:text-[#E5E7EB] transition-all text-sm"
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