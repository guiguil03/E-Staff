import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["**/node_modules/**", "**/backend/**"],
    // "vitest run" est déclenché via le script "prebuild" de "npm run
    // build" — s'il hérite un NODE_ENV=production déjà positionné dans
    // l'environnement (CI), React charge son build de prod, qui ne supporte
    // pas act() : React Testing Library plante alors sur TOUT rendu. Forcé
    // ici explicitement plutôt que de compter sur le NODE_ENV ambiant.
    env: {
      NODE_ENV: "test",
    },
  },
});
