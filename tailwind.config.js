/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          purple: '#a855f7',
          'purple-light': '#d8b4fe',
          'purple-dark': '#7e22ce',
          pink: '#ec4899',
          'pink-light': '#fbcfe8',
          yellow: '#facc15',
          'yellow-light': '#fef08a',
        },
      },
      backgroundImage: {
        'gradient-spend': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'gradient-give': 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
        'gradient-save': 'linear-gradient(135deg, #facc15 0%, #a855f7 100%)',
        'gradient-app': 'linear-gradient(160deg, #fdf4ff 0%, #fce7f3 50%, #fef9c3 100%)',
        'gradient-app-dark': 'linear-gradient(160deg, #1e1027 0%, #2d1040 50%, #1a1a2e 100%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
        'glow-yellow': '0 0 20px rgba(250, 204, 21, 0.5)',
        card: '0 8px 32px rgba(168, 85, 247, 0.15)',
      },
      animation: {
        'bounce-soft': 'bounce 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
