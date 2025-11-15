interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#E2E8F0] hover:shadow-lg transition-all ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient?: string;
  className?: string;
}

export function StatCard({ icon, label, value, gradient = 'from-[#3B82F6] to-[#2563EB]', className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E2E8F0] hover:shadow-lg hover:scale-[1.02] transition-all ${className}`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
          {icon}
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] font-medium mb-1">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-[#1E293B]">{value}</p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: string;
  onClick?: () => void;
  className?: string;
}

export function ActionCard({ icon, title, description, gradient = 'from-[#3B82F6] to-[#2563EB]', onClick, className = '' }: ActionCardProps) {
  return (
    <button 
      onClick={onClick}
      className={`bg-gradient-to-r ${gradient} text-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all text-left w-full ${className}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold">{title}</h3>
          <p className="text-xs sm:text-sm opacity-90">{description}</p>
        </div>
      </div>
    </button>
  );
}
