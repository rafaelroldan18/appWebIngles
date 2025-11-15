/**
 * Sistema de Colores Centralizado - English27
 * Paleta de colores consistente para modo claro y oscuro
 */

export const colors = {
  // Colores Primarios
  primary: {
    light: '#3B82F6',      // blue-500
    dark: '#60A5FA',       // blue-400
    gradient: 'from-blue-500 to-blue-600',
    gradientDark: 'dark:from-blue-600 dark:to-blue-700',
  },

  // Colores Secundarios
  secondary: {
    light: '#10B981',      // green-500
    dark: '#34D399',       // green-400
    gradient: 'from-green-500 to-green-600',
    gradientDark: 'dark:from-green-600 dark:to-green-700',
  },

  // Colores de Acento
  accent: {
    warning: {
      light: '#F59E0B',    // amber-500
      dark: '#FCD34D',     // amber-300
      gradient: 'from-amber-500 to-amber-600',
      gradientDark: 'dark:from-amber-600 dark:to-amber-700',
    },
    danger: {
      light: '#EF4444',    // red-500
      dark: '#F87171',     // red-400
      gradient: 'from-red-500 to-red-600',
      gradientDark: 'dark:from-red-600 dark:to-red-700',
    },
  },

  // Backgrounds
  background: {
    base: 'bg-gray-50 dark:bg-gray-900',
    card: 'bg-white dark:bg-gray-800',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
  },

  // Borders
  border: {
    light: 'border-gray-200 dark:border-gray-700',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400',
  },

  // Text
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  },

  // Estados
  status: {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-500 dark:border-green-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500 dark:border-amber-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500 dark:border-red-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500 dark:border-blue-400',
    },
    neutral: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-500 dark:border-gray-600',
    },
  },
};

// Utilidades para clases combinadas
export const getCardClasses = () => 
  `${colors.background.card} rounded-2xl shadow-sm ${colors.border.light} border`;

export const getButtonPrimaryClasses = () =>
  `bg-gradient-to-r ${colors.primary.gradient} ${colors.primary.gradientDark} text-white`;

export const getButtonSecondaryClasses = () =>
  `bg-gradient-to-r ${colors.secondary.gradient} ${colors.secondary.gradientDark} text-white`;

export const getButtonWarningClasses = () =>
  `bg-gradient-to-r ${colors.accent.warning.gradient} ${colors.accent.warning.gradientDark} text-white`;
