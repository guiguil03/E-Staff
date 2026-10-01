import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./fixtures";
import { seedGradableAttempt } from "./setup/seed-gradable-attempt";

// Golden path 3 : test d'admission (module `evaluation` — pas l'inscription
// "simple", voir e2e/inscription-contrat-paiement.spec.ts pour cet autre
// pipeline) -> notation formateur. En deux parties distinctes :
//
// - Part A pilote la vraie UI candidat (components/evaluation/EvaluationFlow.tsx)
//   pour le Bloc 1 (QCM auto-corrigé + partie ouverte) et le Bloc 2 (essai) —
//   les deux blocs texte, sans dépendance à l'enregistrement audio/vidéo.
// - Part B note un essai formateur (components/evaluation/TrainerDashboard.tsx)
//   sur une tentative séparée, complétée via l'API (voir setup/seed-gradable-attempt.ts) :
//   la file de correction n'affiche que les tentatives aux 5 blocs complets
//   (situations + vidéos incluses), qu'on ne pilote pas via un navigateur ici
//   — voir le commentaire du helper pour le détail de ce choix.
//
// Les Blocs 3 et 5 (mises en situation et vidéos, enregistrés en direct) ne
// sont pilotés ni par l'UI candidat ni par la UI formateur dans ce golden
// path : ils resteraient à couvrir séparément (fake media devices Chromium)
// si le besoin s'en fait sentir.

async function answerQcmBlockViaFirstChoice(page: Page, finalButtonName: string) {
  // Une question à la fois (voir QcmBlock dans EvaluationFlow.tsx) — le
  // contenu réel des questions n'est pas ce qu'on vérifie ici (c'est
  // auto-corrigé côté back), donc on coche toujours le premier choix.
  for (;;) {
    await page.locator('input[type="radio"]').first().check();
    const finalButton = page.getByRole("button", { name: finalButtonName, exact: true });
    if (await finalButton.isVisible()) {
      await finalButton.click();
      return;
    }
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
  }
}

test("un candidat complète les blocs 1 et 2 de son test d'admission", async ({ page }) => {
  const email = `e2e-evaluation-${Date.now()}@exemple.e-staf.mg`;

  await page.goto("/evaluation");
  await page.getByPlaceholder("Prénom", { exact: true }).fill("Njaka");
  await page.getByPlaceholder("Nom", { exact: true }).fill("E2E");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder("Téléphone", { exact: true }).fill("0341234567");
  await page.getByRole("button", { name: "Continuer" }).click();

  await page.getByRole("button", { name: "Commencer le test" }).click();

  // ---- Bloc 1 : QCM (auto-corrigé) puis Partie 2 (ouverte) ---------------
  await page.getByRole("button", { name: /Lexique, Grammaire & Compréhension Écrite/ }).click();
  await answerQcmBlockViaFirstChoice(page, "Continuer vers la partie 2");
  // La soumission du QCM est asynchrone (POST /submit puis setStep) — sans
  // cette attente, les locators suivants peuvent encore matcher les radios
  // de la dernière question QCM plutôt que les champs de la Partie 2.
  await expect(page.getByText("Bloc 1 — Partie 2 : Questions ouvertes et rédaction")).toBeVisible();

  // Partie 2 — 5 champs texte sans label (voir EvaluationFlow.tsx) : sur
  // cette étape (rendu conditionnel, une seule à la fois), ce sont les
  // seuls <input>/<textarea> de la page.
  const plainInputs = page.locator("input");
  await plainInputs.nth(0).fill("chats");
  await plainInputs.nth(1).fill("chevaux");
  await plainInputs.nth(2).fill("journaux");
  await plainInputs.nth(3).fill("Réponse stylistique E2E.");
  await plainInputs.nth(4).fill("Réponse synonyme E2E.");
  await page.locator("textarea").first().fill("Reformulation E2E.");
  await page
    .getByPlaceholder("Rédigez votre réponse ici...")
    .fill(
      "Rédaction E2E couvrant le sujet proposé, suffisamment longue pour illustrer le circuit de soumission de bout en bout."
    );
  await page.getByRole("button", { name: "Valider ce bloc" }).click();

  await expect(
    page.getByRole("button", { name: /Lexique, Grammaire & Compréhension Écrite/ })
  ).toContainText("Terminé — modifiable");

  // ---- Bloc 2 : Commentaire argumentatif ----------------------------------
  await page.getByRole("button", { name: /Commentaire Argumentatif/ }).click();
  await page
    .getByText(/Choisissez un sujet parmi/)
    .locator("xpath=following-sibling::div[1]")
    .getByRole("button")
    .first()
    .click();
  await page
    .getByPlaceholder("Rédigez votre essai ici...")
    .fill(
      "Commentaire argumentatif rédigé pour le parcours E2E, suffisamment développé pour couvrir le sujet proposé et illustrer le circuit de soumission."
    );
  await page.getByRole("button", { name: "Valider ce bloc" }).click();

  await expect(page.getByRole("button", { name: /Commentaire Argumentatif/ })).toContainText(
    "Terminé — modifiable"
  );
});

test("un formateur note un commentaire argumentatif soumis", async ({ page, request }) => {
  const email = `e2e-grading-${Date.now()}@exemple.e-staf.mg`;
  const { candidatFullName } = await seedGradableAttempt(request, email);

  await loginAs(page, "formateur");
  await page.goto("/evaluation/formateur");

  await page.getByRole("button", { name: new RegExp(candidatFullName) }).click();
  // Pastille "E" du carrousel = item "essay" (voir itemKey/label dans
  // TrainerDashboard.tsx) — saute directement dessus plutôt que de naviguer
  // bloc par bloc.
  await page.getByRole("button", { name: "E", exact: true }).click();
  await expect(page.getByText("Commentaire Argumentatif", { exact: true })).toBeVisible();

  // Un niveau par critère : le radio est visuellement masqué (sr-only) mais
  // son <label> englobant est cliquable normalement — le barème réel n'est
  // pas ce qu'on vérifie ici, donc premier niveau de chaque groupe,
  // identifié par le `name` (partagé par les 4 options d'un même critère).
  const levelLabels = page.locator('label:has(input[type="radio"])');
  const seenNames = new Set<string>();
  const labelCount = await levelLabels.count();
  for (let i = 0; i < labelCount; i++) {
    const label = levelLabels.nth(i);
    const name = await label.locator('input[type="radio"]').getAttribute("name");
    if (name && !seenNames.has(name)) {
      seenNames.add(name);
      await label.click();
    }
  }

  // Après l'enregistrement, le carrousel avance automatiquement sur le
  // prochain item non noté (voir handleGraded dans TrainerDashboard.tsx) —
  // l'état "noté" se vérifie donc sur la pastille elle-même, pas sur le
  // panneau de détail qui affiche autre chose entre-temps.
  await page.getByRole("button", { name: "Enregistrer la note" }).click();
  await expect(page.getByRole("button", { name: "E", exact: true })).toHaveClass(/border-success/);
});
