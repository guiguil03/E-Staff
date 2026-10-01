import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL } from "./e2e/db-config";
import {
  E2E_S3_ACCESS_KEY_ID,
  E2E_S3_BUCKET,
  E2E_S3_ENDPOINT_URL,
  E2E_S3_SECRET_ACCESS_KEY,
} from "./e2e/storage-config";

const FRONTEND_PORT = 3100;
const BACKEND_PORT = 3101;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Identifiants de test — partagés avec e2e/fixtures.ts (connexion dans les
// specs). Admin/RH utilisent le mécanisme d'identifiant partagé existant
// (voir backend/src/common/session.ts, identifiantPartage) : valides tant
// qu'aucun CompteStaff actif n'existe pour ce rôle, ce qui est toujours le
// cas sur une base e2e fraîchement migrée. Formateur/Apprenant surchargent
// les matricules par défaut du seed (voir backend/prisma/seed.ts) pour ne
// pas dépendre de ses valeurs par défaut si elles changent un jour.
export const E2E_CREDENTIALS = {
  admin: { matricule: "E2E-ADMIN", password: "E2eAdminPw!1" },
  rh: { matricule: "E2E-RH", password: "E2eRhPw!12" },
  formateur: { matricule: "ETF-FORM-E2E-0001", password: "e2e-formateur-pw" },
  apprenant: { matricule: "ETF-E2E-0001", password: "e2e-apprenant-pw" },
};

// Le backend démarre à chaque run contre une base jetable qu'il migre et
// seed lui-même (voir global-setup.ts pour la base elle-même) : chaque run
// E2E repart d'un état de données connu, indépendant des runs précédents ou
// de la base de dev réelle.
const backendEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  PORT: String(BACKEND_PORT),
  CORS_ORIGIN: FRONTEND_URL,
  FRONTEND_URL,
  JWT_SECRET: "e2e-jwt-secret-ne-jamais-utiliser-en-prod",
  ADMIN_TEST_MATRICULE: E2E_CREDENTIALS.admin.matricule,
  ADMIN_TEST_PASSWORD: E2E_CREDENTIALS.admin.password,
  RH_TEST_MATRICULE: E2E_CREDENTIALS.rh.matricule,
  RH_TEST_PASSWORD: E2E_CREDENTIALS.rh.password,
  FORMATEUR_TEST_MATRICULE: E2E_CREDENTIALS.formateur.matricule,
  FORMATEUR_TEST_PASSWORD: E2E_CREDENTIALS.formateur.password,
  APPRENANT_TEST_MATRICULE: E2E_CREDENTIALS.apprenant.matricule,
  APPRENANT_TEST_PASSWORD: E2E_CREDENTIALS.apprenant.password,
  // Vide = emails en mode stub (voir common/email.service.ts) — les
  // parcours E2E n'ont pas besoin d'e-mails réels, seulement des liens
  // publics (attemptId/registrationId) qu'ils récupèrent via l'UI RH.
  EMAIL_PROVIDER_API_KEY: "",
  SWAGGER_USER: "",
  SWAGGER_PASSWORD: "",
  // Contrats PDF, CV, audio/vidéo d'évaluation (voir StorageService) — sans
  // ça, tout endpoint qui uploade échoue en 500 dès qu'un E2E l'exerce.
  AWS_ENDPOINT_URL: E2E_S3_ENDPOINT_URL,
  AWS_ACCESS_KEY_ID: E2E_S3_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: E2E_S3_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME: E2E_S3_BUCKET,
  AWS_DEFAULT_REGION: "us-east-1",
};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Les specs partagent la même base (pas d'isolation par test) — golden
  // paths séquentiels plutôt que suite exhaustive, voir chaque fichier pour
  // le détail de ce qu'il seed/consomme.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx prisma migrate deploy && npx prisma db seed && npm run start:dev",
      cwd: "backend",
      url: `${BACKEND_URL}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: backendEnv,
    },
    {
      command: "npm run dev",
      url: FRONTEND_URL,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: BACKEND_URL,
        PORT: String(FRONTEND_PORT),
      },
    },
  ],
});
