// URL partagée par playwright.config.ts (démarrage du backend) et
// e2e/global-setup.ts (démarrage/vérification de Postgres) — jamais la base
// Railway de dev/prod (voir backend/.env) : une base jetable, migrée et
// seedée à chaque run.
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/e_staf_e2e";
