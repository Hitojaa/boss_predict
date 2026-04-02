/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#0a0e1a',
          card: '#111827',
          surface: '#1a2236',
          hover: '#1e2d45',
        },
        accent: {
          cyan: '#00d4ff',
          violet: '#7c3aed',
          'cyan-dim': '#00a8cc',
        },
        result: {
          win: '#10b981',
          draw: '#f59e0b',
          loss: '#ef4444',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        confidence: {
          low: '#f97316',
          medium: '#3b82f6',
          high: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['DM Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
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
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-cyan-violet': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
        'gradient-win': 'linear-gradient(90deg, #10b981, #059669)',
        'gradient-card': 'linear-gradient(135deg, #111827, #1a2236)',
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 212, 255, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 212, 255, 0.12)',
      },
    },
  },
  plugins: [],
};
