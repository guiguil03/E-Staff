import { defineConfig, devices } from "@playwright/test";

// E2E ciblés sur les 3 parcours les plus critiques et les plus fragiles aux
// régressions (connexion/rôles, pipeline d'admission, notation) — voir
// discussion 2026-08-10. Tourne contre la base de dev séparée
// (hopper.proxy.rlwy.net, voir backend/.env) : NEXT_PUBLIC_API_URL est
// explicitement forcé vers le backend local ci-dessous, jamais vers la
// production, même si .env.local pointe ailleurs pour le dev habituel.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3005",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run build && npm run start:prod",
      cwd: "./backend",
      url: "http://localhost:3001",
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "npm run dev -- -p 3005",
      url: "http://localhost:3005",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { NEXT_PUBLIC_API_URL: "http://localhost:3001" },
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
