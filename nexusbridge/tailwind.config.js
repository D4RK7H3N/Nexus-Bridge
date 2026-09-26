/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#090D16',
        panel: '#0F172A',
        elevated: '#1E293B',
        subtle: 'rgba(30,41,59,0.5)',
        'border-subtle': '#1E293B',
        'border-strong': '#334155',
        'border-accent': 'rgba(6,182,212,0.4)',
        primary: '#06B6D4',
        'primary-bright': '#22D3EE',
        secondary: '#8B5CF6',
        'secondary-bright': '#C4B5FD',
        tertiary: '#10B981',
        'tertiary-bright': '#34D399',
        warn: '#F59E0B',
        'warn-bright': '#FBBF24',
        crit: '#EF4444',
        'crit-bright': '#F87171',
        ink: '#F8FAFC',
        muted: '#94A3B8',
        dim: '#64748B',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        control: '4px',
        card: '8px',
        modal: '12px',
      },
      boxShadow: {
        'glow-cyan': '0 0 16px -2px rgba(6,182,212,0.25)',
        'glow-cyan-lg': '0 0 24px -2px rgba(6,182,212,0.35)',
        'glow-emerald': '0 0 16px -2px rgba(16,185,129,0.25)',
        'glow-amber': '0 0 16px -2px rgba(245,158,11,0.3)',
        'glow-rose': '0 0 16px -2px rgba(239,68,68,0.3)',
        'glow-violet': '0 0 16px -2px rgba(139,92,246,0.3)',
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      maxWidth: {
        app: '1440px',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.8)' },
        },
        'flow-dash': {
          to: { strokeDashoffset: '-12' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'flow-dash': 'flow-dash 0.6s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.22s ease-out',
        'slide-up': 'slide-up 0.22s ease-out',
      },
    },
  },
  plugins: [],
}
