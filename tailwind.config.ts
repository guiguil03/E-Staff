import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      background: "#F4F3EF", // light universe page background
      ink: "#14161A", // near-black body text
      primary: "#0F1E37", // deep navy — headers, nav, primary buttons, light-universe titles
      accent: "#B8973E", // muted antique gold — the ONE accent used across BOTH universes
      success: "#2F6B4F", // emerald green — "Talents"-side accent in the light universe
      teal: "#1B8A9A", // teal — "Entreprises"-side accent in the light universe
      obsidian: "#0B0E16", // near-black — full-bleed background for the dark/elite universe
      obsidianCard: "#131A2A", // slightly lighter dark blue-gray — card backgrounds in dark/elite universe
      muted: "#807A6E", // warm grey secondary text (light universe only)
      white: "#FFFFFF",
    },
    fontFamily: {
      display: ["var(--font-fraunces)", "serif"],
      sans: ["var(--font-plex-sans)", "sans-serif"],
      mono: ["var(--font-plex-mono)", "monospace"],
    },
    borderRadius: {
      none: "0px",
      DEFAULT: "7px",
      full: "9999px",
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
