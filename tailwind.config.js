/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0f',
          dark: '#12121a',
          panel: '#1a1a24',
          border: '#2a2a3a',
          green: '#00ff88',
          cyan: '#00f0ff',
          pink: '#ff00ff',
          yellow: '#ffff00',
          orange: '#ff8800',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        arcade: ['Orbitron', 'Press Start 2P', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff88, 0 0 20px #00ff8855, 0 0 30px #00ff8833',
        'neon-cyan': '0 0 10px #00f0ff, 0 0 20px #00f0ff55, 0 0 30px #00f0ff33',
        'neon-pink': '0 0 10px #ff00ff, 0 0 20px #00ff0055',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glow': {
          '0%': { filter: 'brightness(1)' },
          '100%': { filter: 'brightness(1.2)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
