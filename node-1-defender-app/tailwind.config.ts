import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      boxShadow: {
        'glow-green': '0 0 20px 2px rgba(34,197,94,0.20)',
        'glow-red':   '0 0 24px 4px rgba(239,68,68,0.30)',
        'glow-amber': '0 0 16px 2px rgba(245,158,11,0.20)',
        glass:        '0 4px 32px 0 rgba(0,0,0,0.37)',
      },
      colors: {
        glass: {
          white:  'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.10)',
          red:    'rgba(239,68,68,0.08)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
