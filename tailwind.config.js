/** @type {import('tailwindcss').Config} */

// CSS variable color helper — enables opacity modifiers like bg-accent/20
const v = (variable) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   v('--sw-bg-primary'),
          secondary: v('--sw-bg-secondary'),
          tertiary:  v('--sw-bg-tertiary'),
        },
        border: {
          soft:   v('--sw-border-soft'),
          medium: v('--sw-border-medium'),
        },
        text: {
          primary:   v('--sw-text-primary'),
          secondary: v('--sw-text-secondary'),
          hint:      v('--sw-text-hint'),
        },
        accent: {
          DEFAULT: v('--sw-accent'),
          light:   v('--sw-accent-light'),
          hover:   v('--sw-accent-hover'),
        },
        positive: v('--sw-positive'),
        negative: v('--sw-negative'),
        warning:  v('--sw-warning'),
        // Bank + category colors stay fixed
        hdfc: '#004C8F',
        icici: '#F37024',
        sbi: '#2B3B8F',
        axis: '#97144D',
        cat: {
          food: '#F97316',
          grocery: '#10B981',
          shopping: '#8B5CF6',
          transport: '#EF4444',
          utilities: '#6366F1',
          health: '#14B8A6',
          entertainment: '#F59E0B',
          education: '#8B5CF6',
          rent: '#6366F1',
          finance: '#6366F1',
          transfers: '#94A3B8',
          income: '#10B981',
          atm: '#F59E0B',
          investments: '#14B8A6',
          travel: '#EC4899',
          personal: '#EC4899',
          charity: '#14B8A6',
          others: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '20px',
      },
      boxShadow: {
        card:        '0 4px 20px rgba(0,0,0,.06)',
        'card-dark': '0 8px 40px rgba(0,0,0,.60)',
        tooltip:     '0 2px 8px rgba(0,0,0,.12)',
        'glow-sm':   '0 0 16px rgba(16,185,129,0.20)',
        'glow-md':   '0 0 32px rgba(16,185,129,0.30)',
      },
      animation: {
        'draw-in':   'drawIn 800ms ease forwards',
        'fade-up':   'fadeUp 350ms ease forwards',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        drawIn: {
          from: { strokeDashoffset: '1000' },
          to:   { strokeDashoffset: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
