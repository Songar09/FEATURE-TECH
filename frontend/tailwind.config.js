/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: { 950: '#07080f', 900: '#0b0d18', 800: '#121527', 700: '#1b1f36', 600: '#272c4a' },
        neon: { cyan: '#22d3ee', blue: '#3b82f6', violet: '#8b5cf6', pink: '#e879f9' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,92,246,.25), 0 10px 40px -10px rgba(139,92,246,.45)',
        'glow-cyan': '0 0 0 1px rgba(34,211,238,.25), 0 10px 40px -10px rgba(34,211,238,.45)',
        soft: '0 8px 30px -12px rgba(0,0,0,.6)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(.95)' },
        },
        'fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'fade-up': 'fade-up .45s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
        pop: 'pop .35s ease-out',
      },
    },
  },
  plugins: [],
};
