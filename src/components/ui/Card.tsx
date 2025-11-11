import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
}

export function Card({ children, className = '', borderColor = 'border-gray-200' }: CardProps) {
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-lg border-4 ${borderColor} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  iconBgColor: string;
  borderColor: string;
  valueColor: string;
}

export function StatCard({ icon, label, value, iconBgColor, borderColor, valueColor }: StatCardProps) {
  return (
    <Card borderColor={borderColor}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 ${iconBgColor} rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 font-semibold">{label}</p>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
