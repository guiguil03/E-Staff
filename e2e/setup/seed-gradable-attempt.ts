import type { APIRequestContext } from "@playwright/test";
import { BACKEND_URL } from "../../playwright.config";

// Les 4 premiers octets d'un conteneur WEBM (audio ou vidéo) — c'est tout ce
// que isAudio()/isVideo() côté backend vérifient (voir
// backend/src/common/file-signature.ts, magic bytes plutôt que parsing
// complet), donc un buffer minimal qui commence par cette signature suffit.
const WEBM_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00, 0x00, 0x00]);

const REQUIRED_SITUATIONS = 5;
const REQUIRED_VIDEOS = 2;

async function postJson(request: APIRequestContext, path: string, data: unknown) {
  const res = await request.post(`${BACKEND_URL}${path}`, { data });
  if (!res.ok()) {
    throw new Error(`${path} -> ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

// Complète les 5 blocs d'une tentative via l'API directement (pas l'UI) —
// la file de correction formateur (listAttemptsForGrading) n'affiche que les
// tentatives au statut "soumis"/"en_correction", qui exige les 5 blocs
// complets (voir EvaluationService.maybeFinalize), situations/vidéos
// incluses. Enregistrer 5 audios + 2 vidéos via un vrai navigateur (caméra/
// micro simulés) est disproportionné pour ce que ce golden path vérifie
// (la UI de notation formateur) — voir e2e/evaluation-notation.spec.ts pour
// le détail de ce qui est piloté par l'UI candidat, séparément.
export async function seedGradableAttempt(request: APIRequestContext, email: string) {
  // Nom de famille unique par run : la file de correction formateur peut
  // accumuler des tentatives d'un run précédent (échec avant nettoyage) —
  // un nom fixe créerait une ambiguïté (locator qui matche plusieurs
  // tentatives) quand on cherche celle du run courant.
  const lastName = `E2E-Seed-${Date.now()}`;
  const { attemptId } = await postJson(request, "/evaluation/candidats", {
    firstName: "Fenosoa",
    lastName,
    email,
    phone: "0341112233",
  });

  await postJson(request, `/evaluation/attempts/${attemptId}/submit`, { lexiqueAnswers: {} });
  await postJson(request, `/evaluation/attempts/${attemptId}/submit`, { oralAnswers: {} });

  await postJson(request, `/evaluation/attempts/${attemptId}/partie-ouverte`, {
    reformulationText: "Réponse E2E.",
    plurielTexts: ["a", "b", "c"],
    styleText: "Réponse E2E.",
    synonymeText: "Réponse E2E.",
    redactionText: "Réponse E2E rédigée pour les besoins du test automatisé.",
  });

  const essaySubjects = (await (
    await request.get(`${BACKEND_URL}/evaluation/essay-subjects`)
  ).json()) as { key: string; title: string }[];
  const essaySubject = essaySubjects[0];
  await postJson(request, `/evaluation/attempts/${attemptId}/essay`, {
    subjectKey: essaySubject.key,
    text:
      "Commentaire argumentatif rédigé pour les besoins du test E2E, afin de valider le " +
      "circuit de notation formateur de bout en bout, sans dépendre du contenu réel.",
  });

  for (let i = 1; i <= REQUIRED_SITUATIONS; i++) {
    const res = await request.post(`${BACKEND_URL}/evaluation/attempts/${attemptId}/situations`, {
      multipart: {
        situationIndex: String(i),
        audio: { name: `situation-${i}.webm`, mimeType: "audio/webm", buffer: WEBM_MAGIC },
      },
    });
    if (!res.ok()) throw new Error(`situations upload -> ${res.status()} ${await res.text()}`);
  }

  for (let i = 1; i <= REQUIRED_VIDEOS; i++) {
    const res = await request.post(`${BACKEND_URL}/evaluation/attempts/${attemptId}/videos`, {
      multipart: {
        taskIndex: String(i),
        video: { name: `video-${i}.webm`, mimeType: "video/webm", buffer: WEBM_MAGIC },
      },
    });
    if (!res.ok()) throw new Error(`videos upload -> ${res.status()} ${await res.text()}`);
  }

  return { attemptId, candidatFullName: `Fenosoa ${lastName}` };
}
