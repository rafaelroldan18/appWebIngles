import { AlertTriangle, X, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#1E293B] dark:text-white">{t.logoutTitle}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-[#64748B] dark:text-gray-400" />
          </button>
        </div>
        
        <p className="text-[#64748B] dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
          {t.logoutMessage}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] dark:border-gray-600 text-[#475569] dark:text-gray-300 rounded-xl font-semibold hover:bg-[#F8FAFC] dark:hover:bg-gray-700 transition-all"
          >
            {t.logoutCancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t.logoutConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
