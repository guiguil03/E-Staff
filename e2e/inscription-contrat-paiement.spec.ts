import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures";

// Golden path 2 : inscription "simple" (module `registrations` — pas le
// test d'admission, voir e2e/evaluation-notation.spec.ts pour l'autre
// pipeline) -> contrat envoyé par la RH -> paiement déclaratif transmis par
// l'inscrit -> confirmation RH. Entièrement piloté via l'UI réelle, des
// deux côtés (inscrit public + Portail RH) — voir components/RegistrationForm.tsx,
// components/compte-admin/InscriptionsPanel.tsx et
// components/registrations/ContratInscrit.tsx pour le détail de chaque étape.
test("un inscrit FOL reçoit son contrat, transmet sa référence, la RH confirme le paiement", async ({
  page,
}) => {
  const email = `e2e-fol-${Date.now()}@exemple.e-staf.mg`;

  // ---- 1. Inscrit : formulaire public (/offres/fol) ----------------------
  await page.goto("/offres/fol");
  await page.getByRole("button", { name: "S'inscrire à la Prochaine Session" }).click();
  await page.getByLabel("Prénom").fill("Voahangy");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Téléphone").fill("0341234567");
  await page.getByRole("button", { name: "S'inscrire à la Prochaine Session" }).click();

  await expect(page.getByText(/est enregistrée\./)).toBeVisible();

  // ---- 2. RH : envoie le contrat depuis le Portail RH ---------------------
  await loginAs(page, "rh");
  await page.goto("/compte/admin/inscriptions");

  const row = page.locator("tr", { hasText: email });
  await row.getByRole("button", { name: "Envoyer le contrat" }).click();
  await row.getByPlaceholder("Durée (ex. 5 semaines)").fill("6 semaines");
  await row.getByPlaceholder("Frais (ex. 50 €)").fill("120 000 Ar");
  await row.getByPlaceholder("Conditions").fill("Paiement intégral avant le début de la session.");
  const sentResponse = page.waitForResponse(
    (res) => res.url().includes("/send-contract") && res.request().method() === "POST"
  );
  await row.getByRole("button", { name: "Envoyer" }).click();
  await sentResponse;
  await expect(row.getByText("Contrat envoyé — en attente de référence")).toBeVisible();

  // Le lien public /inscription/contrat/[id] attend un jeton (lienToken),
  // généré au moment de l'envoi du contrat — pas le cuid, voir
  // backend/src/common/lien-token.ts (audit 2026-09-28). Dans la vraie vie
  // ce jeton part par e-mail ; ici on le relit dans la même liste RH (même
  // donnée, pas d'e-mail réel en E2E).
  const listResponse = page.waitForResponse(
    (res) => res.url().endsWith("/registrations") && res.request().method() === "GET"
  );
  await page.reload();
  const registrations = (await (await listResponse).json()) as { email: string; lienToken: string }[];
  const registration = registrations.find((r) => r.email === email);
  expect(registration, "l'inscription doit toujours être dans la liste RH après l'envoi du contrat").toBeTruthy();
  const lienToken = registration!.lienToken;

  // ---- 3. Inscrit : consulte son contrat et transmet sa référence --------
  await page.goto(`/inscription/contrat/${lienToken}`);
  await expect(page.getByText("Étape suivante : le paiement")).toBeVisible();
  await page.getByLabel("Référence de la transaction").fill("MVOLA-E2E-123456");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma référence" }).click();
  await expect(page.getByText(/Un membre de l'équipe e-Staf vérifie votre paiement/)).toBeVisible();

  // ---- 4. RH : confirme le paiement reçu ----------------------------------
  await page.goto("/compte/admin/inscriptions");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Paiement reçu" }).click();
  await expect(row.getByText("Converti")).toBeVisible();
});
