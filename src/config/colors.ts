/**
 * Sistema de Colores Centralizado - English27
 * Nueva paleta de colores consistente para modo claro y oscuro
 */

export const colors = {
  // Colores Primarios
  primary: {
    light: '#6FA0FF',
    main: '#2B6BEE',
    dark: '#1E4BB5',
    extraDark: '#132F73',
    gradient: 'from-[#2B6BEE] to-[#1E4BB5]',
    gradientDark: 'dark:from-[#6FA0FF] dark:to-[#2B6BEE]',
  },

  // Colores Secundarios
  secondary: {
    light: '#C8C9FF',
    main: '#7C80FF',
    dark: '#4B4FBA',
    gradient: 'from-[#7C80FF] to-[#4B4FBA]',
    gradientDark: 'dark:from-[#C8C9FF] dark:to-[#7C80FF]',
  },

  // Colores de Acento
  accent: {
    success: {
      main: '#37C86F',
      gradient: 'from-[#37C86F] to-[#2BA05A]',
      gradientDark: 'dark:from-[#37C86F] dark:to-[#2BA05A]',
    },

    danger: {
      main: '#E84855',
      gradient: 'from-[#E84855] to-[#D63644]',
      gradientDark: 'dark:from-[#E84855] dark:to-[#D63644]',
    },
    info: {
      main: '#1BC6F2',
      gradient: 'from-[#1BC6F2] to-[#16A8D1]',
      gradientDark: 'dark:from-[#1BC6F2] dark:to-[#16A8D1]',
    },
  },

  // Colores Neutrales
  neutral: {
    100: '#F8FAFC',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
  },

  // Backgrounds
  background: {
    base: 'bg-[#F8FAFC] dark:bg-[#0F172A]',
    card: 'bg-white dark:bg-[#1E293B]',
    hover: 'hover:bg-[#F8FAFC] dark:hover:bg-[#334155]',
  },

  // Borders
  border: {
    light: 'border-[#E5E7EB] dark:border-[#334155]',
    medium: 'border-[#D1D5DB] dark:border-[#475569]',
    focus: 'focus:border-[#2B6BEE] dark:focus:border-[#6FA0FF]',
  },

  // Text - Standardized Typography System
  text: {
    title: 'text-[#111827] dark:text-white',           // H1-H3 titles
    primary: 'text-[#374151] dark:text-[#F8FAFC]',      // Main text (p)
    secondary: 'text-[#6B7280] dark:text-[#E5E7EB]',    // Subtext/labels
    disabled: 'text-[#9CA3AF] dark:text-[#9CA3AF]',     // Disabled (same both modes)
    button: 'text-white',                                // Text on primary buttons
  },

  // Estados
  status: {
    success: {
      bg: 'bg-[#37C86F]/10 dark:bg-[#37C86F]/20',
      text: 'text-[#37C86F] dark:text-[#37C86F]',
      border: 'border-[#37C86F] dark:border-[#37C86F]',
    },

    error: {
      bg: 'bg-[#E84855]/10 dark:bg-[#E84855]/20',
      text: 'text-[#E84855] dark:text-[#E84855]',
      border: 'border-[#E84855] dark:border-[#E84855]',
    },
    info: {
      bg: 'bg-[#1BC6F2]/10 dark:bg-[#1BC6F2]/20',
      text: 'text-[#1BC6F2] dark:text-[#1BC6F2]',
      border: 'border-[#1BC6F2] dark:border-[#1BC6F2]',
    },
    neutral: {
      bg: 'bg-[#F8FAFC] dark:bg-[#1E293B]',
      text: 'text-[#6B7280] dark:text-[#E5E7EB]',
      border: 'border-[#D1D5DB] dark:border-[#334155]',
    },
  },
};

// Utilidades para clases combinadas
export const getCardClasses = () => 
  `${colors.background.card} rounded-lg shadow-sm ${colors.border.light} border`;

export const getButtonPrimaryClasses = () =>
  `bg-gradient-to-r ${colors.primary.gradient} ${colors.primary.gradientDark} text-white`;

export const getButtonSecondaryClasses = () =>
  `bg-gradient-to-r ${colors.secondary.gradient} ${colors.secondary.gradientDark} text-white`;



export const getButtonSuccessClasses = () =>
  `bg-gradient-to-r ${colors.accent.success.gradient} ${colors.accent.success.gradientDark} text-white`;

export const getButtonDangerClasses = () =>
  `bg-gradient-to-r ${colors.accent.danger.gradient} ${colors.accent.danger.gradientDark} text-white`;

export const getButtonInfoClasses = () =>
  `bg-gradient-to-r from-info to-info text-white`;