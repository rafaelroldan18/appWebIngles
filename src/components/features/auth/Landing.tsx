import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/layout/LanguageSelector';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4DB6E8]/30 via-white to-[#4DB6E8]/30 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      {/* Halftone dot pattern in corners */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-32 h-32">
          {Array.from({length: 20}).map((_, i) => (
            <div key={`tl-${i}`} className={`absolute bg-[#0288D1] rounded-full`} style={{
              width: `${Math.max(3, 10 - i * 0.3)}px`,
              height: `${Math.max(3, 10 - i * 0.3)}px`,
              top: `${(i % 5) * 20 + 10}px`,
              left: `${Math.floor(i / 5) * 20 + 10}px`,
              opacity: Math.max(0.5, 0.9 - i * 0.02)
            }} />
          ))}
        </div>
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-32 h-32">
          {Array.from({length: 20}).map((_, i) => (
            <div key={`br-${i}`} className={`absolute bg-[#0288D1] rounded-full`} style={{
              width: `${Math.max(3, 10 - i * 0.3)}px`,
              height: `${Math.max(3, 10 - i * 0.3)}px`,
              bottom: `${(i % 5) * 20 + 10}px`,
              right: `${Math.floor(i / 5) * 20 + 10}px`,
              opacity: Math.max(0.5, 0.9 - i * 0.02)
            }} />
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-md text-center">
        <img 
          src="/images/logo.jpg" 
          alt="Unidad Educativa" 
          className="w-24 h-24 object-contain mx-auto mb-6"
        />
        
        <h1 className="text-4xl font-bold text-[#0288D1] mb-3">
          {t('landingTitle')}
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          {t('landingSubtitle')}
        </p>
        
        <button
          onClick={onGetStarted}
          className="w-full bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
        >
          {t('comenzar')}
        </button>
      </div>
    </div>
  );
}