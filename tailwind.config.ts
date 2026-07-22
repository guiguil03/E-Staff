import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      background: '#F3F5F1',
      ink: '#1A1D1B',
      primary: '#1B3A4B',
      accent: '#D99A2B',
      success: '#2F6B4F',
      muted: '#8C8579',
      white: '#FFFFFF',
    },
    fontFamily: {
      display: ['var(--font-fraunces)', 'serif'],
      sans: ['var(--font-plex-sans)', 'sans-serif'],
      mono: ['var(--font-plex-mono)', 'monospace'],
    },
    borderRadius: {
      none: '0px',
      DEFAULT: '7px',
      full: '9999px',
    },
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
