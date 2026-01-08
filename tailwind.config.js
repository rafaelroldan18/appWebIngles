/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary Colors
        primary: {
          light: '#6FA0FF',
          DEFAULT: '#2B6BEE',
          dark: '#1E4BB5',
          'extra-dark': '#132F73',
        },
        // Secondary Colors
        secondary: {
          light: '#C8C9FF',
          DEFAULT: '#7C80FF',
          dark: '#4B4FBA',
        },
        // Accent/State Colors
        success: '#37C86F',
        danger: '#E84855',
        info: '#1BC6F2',
        // Neutral Colors
        neutral: {
          100: '#F8FAFC',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontSize: {
        'tiny': '0.6875rem',    // 11px
        'xs': '0.75rem',        // 12px
        'sm': '0.875rem',       // 14px
        'base': '1rem',         // 16px
        'lg': '1.125rem',       // 18px
        'xl': '1.25rem',        // 20px
        '2xl': '1.5rem',        // 24px
        '3xl': '1.875rem',      /* 30px */
        '4xl': '2.25rem',       /* 36px */
      },
    },
  },
  plugins: [],
};

