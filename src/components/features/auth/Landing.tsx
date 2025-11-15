import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/layout/LanguageSelector';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Sparkles, Trophy, TrendingUp, BookOpen, Target, Award } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="absolute top-32 right-1/4 animate-float">
          <Trophy className="w-8 h-8 text-yellow-400/30" />
        </div>
        <div className="absolute bottom-40 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
          <Target className="w-10 h-10 text-blue-400/30" />
        </div>
        <div className="absolute top-1/3 right-20 animate-float" style={{ animationDelay: '2s' }}>
          <Award className="w-7 h-7 text-purple-400/30" />
        </div>
        <div className="absolute bottom-1/3 left-20 animate-float" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-6 h-6 text-pink-400/30" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-24 sm:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="flex justify-center lg:justify-start">
              <img 
                src="/images/logo.jpg" 
                alt="English27" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E293B] dark:text-white leading-tight">
                <span className="bg-gradient-to-r from-[#0288D1] to-[#4DB6E8] bg-clip-text text-transparent">
                  {t.landingTitle}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-[#64748B] dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.landingSubtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {t.comenzar}
              </button>
            </div>


          </div>

          <div className="hidden lg:flex justify-center items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-lg">
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 shadow-2xl">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-2xl rotate-12 opacity-80 animate-bounce" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-400 rounded-full opacity-60 animate-pulse" />
                <div className="absolute top-1/4 -right-8 w-16 h-16 bg-pink-400 rounded-lg rotate-45 opacity-70" />
                
                <div className="relative z-10 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transform rotate-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full w-full" />
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full w-3/4" />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transform -rotate-2">
                    <div className="flex items-center justify-between mb-4">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#1E293B] dark:text-white">1,250</p>
                        <p className="text-xs text-[#64748B] dark:text-gray-400">Puntos</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
