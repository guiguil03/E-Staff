import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      background: '#F4F3EF',
      ink: '#14161A',
      primary: '#0F1E37',
      accent: '#B8973E',
      success: '#2F6B4F',
      muted: '#807A6E',
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
