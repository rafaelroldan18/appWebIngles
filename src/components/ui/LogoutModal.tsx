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
      <div className="bg-white dark:bg-[#374151] rounded-lg p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-[#F7A425]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{t.logoutTitle}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#6B7280] transition-colors"
          >
            <X className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          </button>
        </div>
        
        <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6 sm:mb-8 text-sm sm:text-base">
          {t.logoutMessage}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-[#E5E7EB] dark:border-[#6B7280] text-[#6B7280] dark:text-[#9CA3AF] rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#6B7280] transition-all"
          >
            {t.logoutCancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#E84855] to-[#D63644] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t.logoutConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
