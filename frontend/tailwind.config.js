/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066cc',
          focus: '#0071e3',
          dark: '#2997ff',
          hover: '#0055b3',
        },
        ink: {
          DEFAULT: '#1d1d1f',
          muted80: '#333333',
          muted48: '#7a7a7a',
        },
        canvas: {
          DEFAULT: '#ffffff',
          parchment: '#f5f5f7',
        },
        surface: {
          pearl: '#fafafc',
          tile1: '#272729',
          tile2: '#2a2a2c',
          tile3: '#252527',
          black: '#000000',
          chip: 'rgba(210, 210, 215, 0.64)',
          chipDark: 'rgba(45, 45, 48, 0.75)',
        },
        hairline: {
          DEFAULT: '#e0e0e0',
          dark: 'rgba(255, 255, 255, 0.12)',
        },
        divider: {
          soft: '#f0f0f0',
          dark: 'rgba(255, 255, 255, 0.08)',
        },
        status: {
          fault: '#ff3b30',
          degraded: '#ff9f0a',
          occupied: '#0066cc',
          occupiedDark: '#2997ff',
          reserved: '#5856d6',
          free: '#8e8e93',
          optimal: '#30d158',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          'SF Pro Text',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        'tight-hero': '-0.28px',
        'tight-title': '-0.374px',
        'tight-caption': '-0.224px',
        'tight-fine': '-0.12px',
      },
      borderRadius: {
        'xs': '5px',
        'sm': '8px',
        'md': '11px',
        'lg': '18px',
        'pill': '9999px',
      },
      boxShadow: {
        'apple-product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'apple-glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'apple-focus': '0 0 0 3px rgba(0, 113, 227, 0.45)',
      },
    },
  },
  plugins: [],
}

