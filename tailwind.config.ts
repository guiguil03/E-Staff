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
      // Added for the "two visual universes" spec: teal is the Entreprises-side
      // accent on light institutional pages (home, examens). Obsidian/obsidianCard
      // are the near-black premium background used only on the elite pages
      // (FOL, Studio Métier) — deliberately darker than `primary`.
      teal: '#1B8A9A',
      obsidian: '#0B0E16',
      obsidianCard: '#131A2A',
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
