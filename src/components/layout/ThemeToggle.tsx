import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg bg-white/80 dark:bg-[#374151]/80 backdrop-blur-sm border border-[#E5E7EB] dark:border-[#6B7280] hover:bg-white dark:hover:bg-[#374151] transition-all shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
      ) : (
        <Sun className="w-5 h-5 text-[#6B7280] dark:text-[#9CA3AF]" />
      )}
    </button>
  );
}
