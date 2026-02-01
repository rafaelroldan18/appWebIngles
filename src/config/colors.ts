/**
 * config/colors.ts
 * Centralized color system and UI constants for the application
 */

export const colors = {
    primary: {
        main: '#2B6BEE',
        light: '#6FA0FF',
        dark: '#1E4BB5',
        extraDark: '#132F73',
        gradient: 'from-blue-600 to-indigo-600',
        gradientDark: 'dark:from-blue-500 dark:to-indigo-500',
    },
    secondary: {
        main: '#7C80FF',
        light: '#C8C9FF',
        dark: '#4B4FBA',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        gradient: 'from-purple-600 to-indigo-600',
        gradientDark: 'dark:from-purple-500 dark:to-indigo-500',
    },
    accent: {
        success: {
            main: '#37C86F',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            gradient: 'from-emerald-400 to-teal-500',
        },
        danger: {
            main: '#E84855',
            bg: 'bg-red-50 dark:bg-red-900/20',
            gradient: 'from-red-400 to-pink-500',
        },
        info: {
            main: '#1BC6F2',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            gradient: 'from-blue-400 to-cyan-500',
        },
        warning: {
            main: '#F59E0B',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            gradient: 'from-amber-400 to-orange-500',
        }
    },
    status: {
        success: {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800',
        },
        error: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800',
        },
        info: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-700 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800',
        },
        neutral: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-700 dark:text-gray-400',
            border: 'border-gray-200 dark:border-gray-700',
        },
    },
    background: {
        base: 'bg-slate-50 dark:bg-slate-950',
        card: 'bg-white dark:bg-slate-900',
    },
    text: {
        title: 'text-slate-900 dark:text-white',
        primary: 'text-slate-800 dark:text-slate-200',
        secondary: 'text-slate-500 dark:text-slate-400',
    },
    border: {
        light: 'border-slate-200 dark:border-slate-800',
        focus: 'border-blue-500 dark:border-blue-400',
    },
    // Used in Landing and other components for indexed accessibility
    neutral: {
        100: 'bg-slate-100 dark:bg-slate-800',
        200: 'bg-slate-200 dark:bg-slate-700',
        300: 'bg-slate-300 dark:bg-slate-600',
    }
};

export const getCardClasses = () =>
    `bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all`;

export const getButtonPrimaryClasses = () =>
    `bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95`;

export const getButtonSecondaryClasses = () =>
    `bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95`;

export const getButtonInfoClasses = () =>
    `bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95`;
