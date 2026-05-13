import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // v3 leans heavier on the orange/electric accent + a deeper near-black
        // chassis. Bolder, more confident, less luxury-navy.
        ink: {
          50: '#f5f6f8',
          100: '#e6e8ee',
          200: '#bfc4d0',
          300: '#9097a8',
          400: '#5f667a',
          500: '#3a4054',
          600: '#262b3b',
          700: '#181c2a',
          800: '#0f1320',
          900: '#080a14',
          950: '#040509',
        },
        orange: {
          50: '#fff5ed',
          100: '#ffe6d4',
          200: '#ffc79f',
          300: '#ffa05f',
          400: '#ff7a31',
          500: '#ff5a0a',
          600: '#ed4200',
          700: '#c63300',
          800: '#9c2a04',
          900: '#7d2509',
        },
        // Electric accent — for active states, highlights
        zap: {
          400: '#ffe14a',
          500: '#ffd000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Archivo"', '"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
