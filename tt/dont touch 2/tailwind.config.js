/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'threat-red': '#dc2626',
        'blood-orange': '#ea580c',
        'phosphor-green': '#22c55e',
        'glitch-red': '#ef4444',
        'void-black': '#000000',
        'void-dark': '#030000',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Space Mono', 'monospace'],
      },
      boxShadow: {
        'inset-threat': 'inset 0 0 20px rgba(220, 38, 38, 0.05)',
        'threat-glow': '0 0 100px rgba(220, 38, 38, 1)',
      },
      backgroundImage: {
        'threat-gradient': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        'catastrophic': '96px',
      },
      keyframes: {
        scanlines: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        glitch: {
          '0%, 100%': { transform: 'skewX(0deg)', filter: 'invert(0)' },
          '25%': { transform: 'skewX(-5deg)', filter: 'invert(1)' },
          '50%': { transform: 'skewX(5deg)', filter: 'invert(1)' },
          '75%': { transform: 'skewX(-2deg)', filter: 'invert(0)' },
        },
        pulse-intense: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'flash-yellow': {
          '0%, 100%': { background: 'transparent' },
          '50%': { background: 'rgba(234, 88, 12, 0.3)' },
        },
      },
      animation: {
        scanlines: 'scanlines 8s linear infinite',
        glitch: 'glitch 1.5s ease-in-out forwards',
        'pulse-intense': 'pulse-intense 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        radar: 'radar 4s linear infinite',
        'flash-yellow': 'flash-yellow 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
