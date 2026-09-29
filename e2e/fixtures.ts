import type { Page } from "@playwright/test";
import { E2E_CREDENTIALS } from "../playwright.config";

export type Role = keyof typeof E2E_CREDENTIALS;

export const ROLE_LANDING_TITLE: Record<Role, string> = {
  apprenant: "Espace Apprenant — e-Staf",
  formateur: "Cockpit Formateur — e-Staf",
  admin: "Académie & Vagues — Portail RH — e-Staf",
  rh: "Portail RH — e-Staf",
};

// Connexion via le vrai formulaire (voir components/comptes/LoginForm.tsx) —
// attend la redirection vers le tableau de bord du rôle plutôt qu'un délai
// fixe, pour ne pas dépendre de la latence du backend.
export async function loginAs(page: Page, role: Role) {
  const { matricule, password } = E2E_CREDENTIALS[role];
  await page.goto("/connexion");
  await page.getByLabel("Numéro matricule").fill(matricule);
  await page.getByLabel("Mot de passe / code").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => url.pathname !== "/connexion");
}
