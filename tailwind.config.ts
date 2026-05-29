import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navi: {
          bg:             '#030617',  // deep space — 70% 비중
          surface:        '#101936',  // primary card surface
          surface2:       '#162142',  // secondary / inner elements
          surface3:       '#1B2B55',  // interactive / hover
          border:         '#1B2847',  // card outline
          border2:        '#263558',  // secondary border
          accent:         '#2D4198',  // brand blue — 10% 비중
          'accent-hover': '#3D54BF',
          'accent-dim':   'rgba(45,65,152,0.15)',
          text:           '#F8F9F7',
          secondary:      'rgba(248,249,247,0.75)', // 75% opacity
          muted:          'rgba(248,249,247,0.45)', // 45% opacity
          green:          '#26a69a',
          red:            '#ef5350',
          bullish:        '#26a69a',
          bearish:        '#ef5350',
        },
      },
      keyframes: {
        'navi-slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'navi-fade': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'navi-slide-up': 'navi-slide-up 200ms cubic-bezier(0.16,1,0.3,1) forwards',
        'navi-fade':     'navi-fade 150ms ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
