import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="w-10 h-10 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
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
