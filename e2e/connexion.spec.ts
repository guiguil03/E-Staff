import { test, expect } from "@playwright/test";
import { loginAs, ROLE_LANDING_TITLE, type Role } from "./fixtures";

// Golden path 1 : connexion + accès compte, pour chacun des 4 rôles gérés
// par /auth/login (voir backend/src/auth/auth.controller.ts) — le plus
// simple des 3 parcours E2E, sert surtout à valider l'infra (backend +
// frontend + base jetable) avant les parcours plus longs.
for (const role of ["apprenant", "formateur", "admin", "rh"] as Role[]) {
  test(`connexion ${role} redirige vers son tableau de bord`, async ({ page }) => {
    await loginAs(page, role);
    await expect(page).toHaveTitle(ROLE_LANDING_TITLE[role]);
  });
}

test("un mauvais mot de passe affiche le message générique sans rediriger", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Numéro matricule").fill("ETF-FORM-E2E-0001");
  await page.getByLabel("Mot de passe / code").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByText("Matricule ou mot de passe invalide.")).toBeVisible();
  await expect(page).toHaveURL(/\/connexion$/);
});
