/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070a11',
        surface: '#0d121f',
        'surface-raised': '#131a2b',
        cyan: {
          DEFAULT: '#00f3ff',
          dim: '#0891a8'
        },
        phosphor: '#00ff66',
        crimson: '#ff003c',
        amber: '#ffb800',
        violet: '#9d00ff'
      },
            fontFamily: {
        mono: ['"SUSE"', 'sans-serif'],
        sans: ['"SUSE"', 'sans-serif'],
        display: ['"SUSE"', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 243, 255, 0.35)',
        'glow-crimson': '0 0 20px rgba(255, 0, 60, 0.4)',
        'glow-phosphor': '0 0 16px rgba(0, 255, 102, 0.35)',
        'glow-violet': '0 0 20px rgba(157, 0, 255, 0.35)',
        'glow-amber': '0 0 16px rgba(255, 184, 0, 0.35)'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 }
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '92%': { opacity: 1 },
          '93%': { opacity: 0.4 },
          '94%': { opacity: 1 }
        }
      },
      animation: {
        scanline: 'scanline 3s linear infinite',
        pulseGlow: 'pulseGlow 2.2s ease-in-out infinite',
        flicker: 'flicker 4s linear infinite'
      }
    }
  },
  plugins: []
};

