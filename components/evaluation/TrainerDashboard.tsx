"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiGet, apiGetBlob, apiPost } from "@/lib/api";

interface Candidat {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface QcmQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctChoice: string;
}

interface SituationResponse {
  id: string;
  situationIndex: number;
  audioUrl: string;
  score: number | null;
  gradedAt: string | null;
}

interface VideoResponse {
  id: string;
  taskIndex: number;
  videoUrl: string;
  subjectKey: string | null;
  optionKey: string | null;
  score: number | null;
  gradedAt: string | null;
}

interface EssayResponse {
  id: string;
  subjectKey: string;
  text: string;
  wordCount: number;
  score: number | null;
  gradedAt: string | null;
}

interface EcritOuvertResponse {
  id: string;
  reformulationText: string;
  plurielTexts: string; // JSON string[3]
  styleText: string;
  synonymeText: string;
  redactionText: string;
  redactionWordCount: number;
  score: number | null;
  gradedAt: string | null;
}

interface Attempt {
  id: string;
  status: string;
  lexiqueAnswers: string | null;
  oralAnswers: string | null;
  lexiqueQcmScore: number | null;
  lexiqueScore: number | null;
  oralScore: number | null;
  situationsScore: number | null;
  videoScore: number | null;
  essayScore: number | null;
  totalScore: number | null;
  tier: string | null;
  submittedAt: string | null;
  rhNotifiedAt: string | null;
  candidat: Candidat;
  situationResponses: SituationResponse[];
  videoResponses: VideoResponse[];
  essayResponse: EssayResponse | null;
  ecritOuvertResponse: EcritOuvertResponse | null;
}

const STATUS_LABELS: Record<string, string> = {
  en_cours: "En cours",
  soumis: "Soumis",
  en_correction: "En correction",
  corrige: "Corrigé",
  rejete: "Non retenu",
  valide_pret_envoi: "Contrat prêt à envoyer",
  contrat_envoye: "Contrat envoyé",
  en_attente_paiement: "En attente de paiement",
  active: "Actif (inscrit)",
};

const TIER_LABELS: Record<string, string> = {
  refuse: "Refusé",
  formation_b1: "Formation B1",
  niveau_b2: "Niveau B2",
  niveau_c1: "Niveau C1",
  placement_direct: "Placement direct",
};

interface Situation {
  index: number;
  domain: string;
  context: string;
  mission: string;
}

interface VideoTaskOption {
  key: string;
  role: string;
  objectif: string;
  introduction: string;
  developpement: string;
  conclusion: string;
}

interface LinguisticConstraint {
  intro: string;
  termes: string[];
  minimum: number;
}

interface VideoTaskSubject {
  key: string;
  title: string;
  context: string;
  options: VideoTaskOption[];
  linguisticConstraint?: LinguisticConstraint;
  hasReferenceVideo?: boolean;
  referenceVideoEmbedUrl?: string;
}

interface VideoTask {
  index: number;
  title: string;
  context: string;
  subjects?: VideoTaskSubject[];
  mission?: string;
  maxSeconds: number;
}

interface EssaySubject {
  key: string;
  domain: string;
  title: string;
  texte: string;
  consigne: string;
  minWords: number;
  maxWords: number;
}

interface PartieOuverteContent {
  reformulation: { consigne: string; phrase: string; starter: string; corrige: string };
  pluriels: { mot: string; corrige: string }[];
  stylistique: { phrase: string; question: string; corrige: string };
  synonyme: { phrase: string; mot: string; corrige: string };
  redaction: { sujet: string; consignes: string[]; minWords: number; maxWords: number };
}

interface PartieOuverteCriterion {
  key: string;
  label: string;
  description: string;
  maxPoints: number;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface GradingCriterion {
  key: string;
  label: string;
  description: string;
  descriptors: Record<string, string>;
}

// Échelons du barème officiel (4 niveaux par critère, voir
// backend/src/evaluation/situations.ts pour la source de vérité).
const GRADING_LEVELS = [
  { key: "0.25", value: 0.25, label: "Insuffisant" },
  { key: "0.5", value: 0.5, label: "Passable" },
  { key: "0.75", value: 0.75, label: "Bon" },
  { key: "1", value: 1, label: "Excellent" },
] as const;

// Échelons du barème Bloc 5 (voir backend/src/evaluation/video-tasks.ts).
const VIDEO_GRADING_LEVELS = [
  { key: "0.5", value: 0.5, label: "Insuffisant" },
  { key: "1", value: 1, label: "Passable" },
  { key: "1.5", value: 1.5, label: "Bon" },
  { key: "2", value: 2, label: "Excellent" },
] as const;

// Échelons de la grille officielle Bloc 2 (grille_evaluation_c1_ecrit.pdf,
// voir backend/src/evaluation/commentaire-argumentatif.ts) — Insuffisant et
// Moyen sont des plages (0-1 et 1,5-2,5 pts) sur le document source,
// exposées ici en 3 valeurs espacées de 0,5 pour choisir la précision sans
// trahir les bornes ; Bien (3) et Excellent (4) sont des valeurs fixes.
const ESSAY_GRADING_LEVELS = [
  { key: "0", value: 0, label: "Insuffisant", band: "Insuffisant" },
  { key: "0.5", value: 0.5, label: "Insuffisant", band: "Insuffisant" },
  { key: "1", value: 1, label: "Insuffisant", band: "Insuffisant" },
  { key: "1.5", value: 1.5, label: "Moyen", band: "Moyen" },
  { key: "2", value: 2, label: "Moyen", band: "Moyen" },
  { key: "2.5", value: 2.5, label: "Moyen", band: "Moyen" },
  { key: "3", value: 3, label: "Bien", band: "Bien" },
  { key: "4", value: 4, label: "Excellent", band: "Excellent" },
] as const;

// Code formateur (x-trainer-code) retiré le 2026-08-25 à la demande du
// client — trop de friction pour l'usage actuel (voir TrainerGuard côté
// backend, toujours défini mais plus branché sur ces routes). La page reste
// hors nav, accessible par URL directe uniquement.
export default function TrainerDashboard() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Une fois la correction terminée, la tentative sort de la file
  // ("corrige" n'est plus dans le filtre soumis/en_correction de
  // /evaluation/attempts) — cet état garde sa version à jour affichée
  // (score final, bouton "Envoyer vers RH") jusqu'à ce que le formateur
  // sélectionne autre chose.
  const [openAttempt, setOpenAttempt] = useState<Attempt | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [essaySubjects, setEssaySubjects] = useState<EssaySubject[]>([]);
  const [partieOuverteContent, setPartieOuverteContent] = useState<PartieOuverteContent | null>(
    null
  );
  const [criteria, setCriteria] = useState<GradingCriterion[]>([]);
  const [videoCriteria, setVideoCriteria] = useState<GradingCriterion[]>([]);
  const [essayCriteria, setEssayCriteria] = useState<GradingCriterion[]>([]);
  const [partieOuverteCriteria, setPartieOuverteCriteria] = useState<PartieOuverteCriterion[]>([]);
  const [questions, setQuestions] = useState<{ lexique: QcmQuestion[]; oral: QcmQuestion[] } | null>(
    null
  );
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    refreshList();
    apiGet<Situation[]>("/evaluation/situations").then(setSituations).catch(() => {});
    apiGet<VideoTask[]>("/evaluation/video-tasks").then(setVideoTasks).catch(() => {});
    apiGet<EssaySubject[]>("/evaluation/essay-subjects").then(setEssaySubjects).catch(() => {});
    apiGet<{ lexique: QcmQuestion[]; oral: QcmQuestion[] }>("/evaluation/questions-corrigees")
      .then(setQuestions)
      .catch(() => {});
    apiGet<PartieOuverteContent>("/evaluation/partie-ouverte")
      .then(setPartieOuverteContent)
      .catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/grading-criteria").then(setCriteria).catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/video-grading-criteria")
      .then(setVideoCriteria)
      .catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/essay-grading-criteria")
      .then(setEssayCriteria)
      .catch(() => {});
    apiGet<PartieOuverteCriterion[]>("/evaluation/partie-ouverte-grading-criteria")
      .then(setPartieOuverteCriteria)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList() {
    try {
      const list = await apiGet<Attempt[]>("/evaluation/attempts");
      setAttempts(list);
      setListError(null);
    } catch {
      setListError("Impossible de charger les tentatives.");
    }
  }

  const selected =
    attempts.find((a) => a.id === selectedId) ??
    (openAttempt?.id === selectedId ? openAttempt : null);

  async function refreshSelectedAttempt() {
    if (!selectedId) return;
    try {
      const updated = await apiGet<Attempt>(`/evaluation/attempts/${selectedId}`);
      setOpenAttempt(updated);
    } catch {
      // le tableau principal reste à jour même si ce fetch ponctuel échoue
    }
    refreshList();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded border border-white/10 bg-obsidianCard p-4">
        <h3 className="font-display text-sm font-semibold text-white">
          Tentatives à corriger
        </h3>
        {listError && <p className="mt-2 text-xs text-accent">{listError}</p>}
        <ul className="mt-3 space-y-2">
          {attempts.map((a) => {
            const gradedSituations = a.situationResponses.filter((r) => r.gradedAt).length;
            const gradedVideos = a.videoResponses.filter((r) => r.gradedAt).length;
            const gradedEssay = a.essayResponse?.gradedAt ? 1 : 0;
            const gradedPartieOuverte = a.ecritOuvertResponse?.gradedAt ? 1 : 0;
            const graded = gradedSituations + gradedVideos + gradedEssay + gradedPartieOuverte;
            const total =
              a.situationResponses.length +
              a.videoResponses.length +
              (a.essayResponse ? 1 : 0) +
              (a.ecritOuvertResponse ? 1 : 0);
            return (
              <li key={a.id}>
                <button
                  onClick={() => {
                    setSelectedId(a.id);
                    setOpenAttempt(null);
                  }}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === a.id
                      ? "border-accent bg-obsidian text-white"
                      : "border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  <span className="block font-medium">
                    {a.candidat.firstName} {a.candidat.lastName}
                  </span>
                  <span className="block text-xs text-white/50">
                    {STATUS_LABELS[a.status] ?? a.status} — {graded}/{total} notées
                  </span>
                </button>
              </li>
            );
          })}
          {attempts.length === 0 && (
            <p className="text-xs text-white/50">Aucune tentative en attente.</p>
          )}
        </ul>
      </div>

      <div>
        {selected ? (
          <AttemptDetail
            attempt={selected}
            situations={situations}
            videoTasks={videoTasks}
            essaySubjects={essaySubjects}
            partieOuverteContent={partieOuverteContent}
            questions={questions}
            criteria={criteria}
            videoCriteria={videoCriteria}
            essayCriteria={essayCriteria}
            partieOuverteCriteria={partieOuverteCriteria}
            onGraded={refreshSelectedAttempt}
          />
        ) : (
          <p className="text-sm text-white/50">
            Sélectionnez une tentative à gauche.
          </p>
        )}
      </div>
    </div>
  );
}

type CarouselItem =
  | { type: "qcm"; qcmType: "lexique" | "oral" }
  | { type: "situation"; response: SituationResponse }
  | { type: "video"; response: VideoResponse }
  | { type: "essay"; response: EssayResponse }
  | { type: "partie-ouverte"; response: EcritOuvertResponse };

// Les items "qcm" (auto-corrigés à la soumission, voir scoreQcm côté back)
// n'ont pas de `.response` — ces deux helpers évitent de spécialiser chaque
// site qui lisait auparavant item.response.id / .gradedAt directement.
function itemKey(item: CarouselItem): string {
  return item.type === "qcm" ? `qcm-${item.qcmType}` : item.response.id;
}
function itemIsGraded(item: CarouselItem): boolean {
  // Un QCM est "noté" dès la soumission (correction automatique) — jamais en
  // attente de correction manuelle.
  return item.type === "qcm" ? true : Boolean(item.response.gradedAt);
}

// Bouton affiché une fois la correction terminée (statut "corrige") —
// prévient explicitement la RH par e-mail (voir EvaluationService.notifyRh)
// au lieu de compter uniquement sur le passage régulier de la RH dans son
// tableau de validation.
function NotifyRhButton({ attempt, onSent }: { attempt: Attempt; onSent: () => void }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function send() {
    setSending(true);
    setError(false);
    try {
      await apiPost(`/evaluation/attempts/${attempt.id}/notify-rh`, {});
      onSent();
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (attempt.rhNotifiedAt) {
    return (
      <p className="mt-2 font-mono text-[11px] text-white/40">
        RH prévenue le {new Date(attempt.rhNotifiedAt).toLocaleDateString("fr-FR")}
      </p>
    );
  }

  return (
    <div className="mt-3">
      <Button variant="ghostDark" onClick={send} disabled={sending}>
        {sending ? "Envoi..." : "Envoyer les résultats vers RH"}
      </Button>
      {error && <p className="mt-1 text-xs text-accent">Échec de l&apos;envoi — réessayer.</p>}
    </div>
  );
}

// Carrousel plutôt qu'un long scroll vertical (rendus empilés — 5 mises en
// situation + 2 vidéos + 1 essai, chacun avec son support (audio/vidéo/
// texte) + grille de critères — était bien trop long, retour client
// 2026-08-25). Un rendu affiché à la fois, navigation précédent/suivant +
// pastilles cliquables (vertes une fois notées) pour sauter directement à
// un rendu donné. La notation avance automatiquement au rendu suivant après
// l'enregistrement d'une note.
function AttemptDetail({
  attempt,
  situations,
  videoTasks,
  essaySubjects,
  partieOuverteContent,
  questions,
  criteria,
  videoCriteria,
  essayCriteria,
  partieOuverteCriteria,
  onGraded,
}: {
  attempt: Attempt;
  situations: Situation[];
  videoTasks: VideoTask[];
  essaySubjects: EssaySubject[];
  partieOuverteContent: PartieOuverteContent | null;
  questions: { lexique: QcmQuestion[]; oral: QcmQuestion[] } | null;
  criteria: GradingCriterion[];
  videoCriteria: GradingCriterion[];
  essayCriteria: GradingCriterion[];
  partieOuverteCriteria: PartieOuverteCriterion[];
  onGraded: () => void;
}) {
  // Ordre = celui du test réel (Bloc 1 à 5), montrant aussi les parties
  // auto-corrigées (QCM) — pas seulement ce qui reste à noter à la main —
  // pour que le formateur voie l'intégralité de la copie d'un coup d'œil.
  const items: CarouselItem[] = [
    ...(attempt.lexiqueAnswers ? [{ type: "qcm" as const, qcmType: "lexique" as const }] : []),
    ...(attempt.ecritOuvertResponse
      ? [{ type: "partie-ouverte" as const, response: attempt.ecritOuvertResponse }]
      : []),
    ...(attempt.essayResponse ? [{ type: "essay" as const, response: attempt.essayResponse }] : []),
    ...attempt.situationResponses
      .slice()
      .sort((a, b) => a.situationIndex - b.situationIndex)
      .map((response) => ({ type: "situation" as const, response })),
    ...(attempt.oralAnswers ? [{ type: "qcm" as const, qcmType: "oral" as const }] : []),
    ...attempt.videoResponses
      .slice()
      .sort((a, b) => a.taskIndex - b.taskIndex)
      .map((response) => ({ type: "video" as const, response })),
  ];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [attempt.id]);

  const current = index < items.length ? items[index] : null;
  const gradedCount = items.filter(itemIsGraded).length;

  function handleGraded() {
    onGraded();
    setIndex((i) => Math.min(i + 1, items.length - 1));
  }

  return (
    <div className="space-y-4">
      <div className="rounded border border-white/10 bg-obsidianCard p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              {attempt.candidat.firstName} {attempt.candidat.lastName}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs text-white/50">
              <span>{attempt.candidat.email}</span>
              <span>{attempt.candidat.phone}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              {STATUS_LABELS[attempt.status] ?? attempt.status}
            </span>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Inscrit le{" "}
              {new Date(attempt.candidat.createdAt).toLocaleDateString("fr-FR")}
              {attempt.submittedAt &&
                ` · Soumis le ${new Date(attempt.submittedAt).toLocaleDateString("fr-FR")}`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm text-white/80 sm:grid-cols-5">
          <p>Lexique : {attempt.lexiqueScore ?? "—"}/20</p>
          <p>Essai : {attempt.essayScore ?? "—"}/20</p>
          <p>Situations : {attempt.situationsScore ?? "—"}/20</p>
          <p>Oral : {attempt.oralScore ?? "—"}/20</p>
          <p>Vidéo : {attempt.videoScore ?? "—"}/20</p>
        </div>
        {attempt.totalScore !== null && (
          <p className="mt-2 text-sm text-accent">
            Total : {attempt.totalScore}/100 — {(attempt.tier && TIER_LABELS[attempt.tier]) ?? attempt.tier ?? "—"}
          </p>
        )}
        {attempt.status === "corrige" && (
          <NotifyRhButton attempt={attempt} onSent={onGraded} />
        )}
      </div>

      {items.length === 0 && (
        <p className="rounded border border-white/10 bg-obsidianCard p-4 text-sm text-white/50">
          Aucune mise en situation ni vidéo déposée pour l&apos;instant.
        </p>
      )}

      {current && (
        <>
          <div className="flex items-center justify-between gap-3 rounded border border-white/10 bg-obsidianCard px-3 py-2.5">
            <Button
              variant="ghostDark"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              ← Précédent
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {items.map((item, i) => {
                const label =
                  item.type === "situation"
                    ? `S${item.response.situationIndex}`
                    : item.type === "video"
                      ? `V${item.response.taskIndex}`
                      : item.type === "essay"
                        ? "E"
                        : item.type === "partie-ouverte"
                          ? "P2"
                          : item.qcmType === "lexique"
                            ? "QCM1"
                            : "QCM4";
                const graded = itemIsGraded(item);
                return (
                  <button
                    key={itemKey(item)}
                    onClick={() => setIndex(i)}
                    className={`rounded-full border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                      i === index
                        ? "border-accent bg-accent/10 text-accent"
                        : graded
                          ? "border-success/50 text-success"
                          : "border-white/15 text-white/50 hover:border-white/30"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghostDark"
              onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
              disabled={index === items.length - 1}
            >
              Suivant →
            </Button>
          </div>
          <p className="text-center font-mono text-xs text-white/40">
            {index + 1} / {items.length} — {gradedCount} noté{gradedCount > 1 ? "s" : ""} au total
          </p>

          {current.type === "qcm" ? (
            <QcmReview
              key={itemKey(current)}
              qcmType={current.qcmType}
              bank={current.qcmType === "lexique" ? questions?.lexique : questions?.oral}
              answersJson={
                current.qcmType === "lexique" ? attempt.lexiqueAnswers : attempt.oralAnswers
              }
              score={current.qcmType === "lexique" ? attempt.lexiqueQcmScore : attempt.oralScore}
              maxScore={current.qcmType === "lexique" ? 10 : 20}
            />
          ) : current.type === "situation" ? (
            <SituationGrader
              key={current.response.id}
              response={current.response}
              situation={situations.find((s) => s.index === current.response.situationIndex)}
              criteria={criteria}
              onGraded={handleGraded}
            />
          ) : current.type === "video" ? (
            <VideoGrader
              key={current.response.id}
              response={current.response}
              task={videoTasks.find((t) => t.index === current.response.taskIndex)}
              criteria={videoCriteria}
              onGraded={handleGraded}
            />
          ) : current.type === "essay" ? (
            <EssayGrader
              key={current.response.id}
              response={current.response}
              subject={essaySubjects.find((s) => s.key === current.response.subjectKey)}
              criteria={essayCriteria}
              onGraded={handleGraded}
            />
          ) : (
            <PartieOuverteGrader
              key={current.response.id}
              response={current.response}
              content={partieOuverteContent}
              criteria={partieOuverteCriteria}
              onGraded={handleGraded}
            />
          )}
        </>
      )}
    </div>
  );
}

// Lecture seule — les QCM (Bloc 1 Partie 1 et Bloc 4) sont notés
// automatiquement à la soumission (voir scoreQcm côté back), rien à
// corriger ici. Affiché quand même dans le carrousel pour que le formateur
// voie l'intégralité de la copie, pas seulement les blocs à noter à la main.
function QcmReview({
  qcmType,
  bank,
  answersJson,
  score,
  maxScore,
}: {
  qcmType: "lexique" | "oral";
  bank: QcmQuestion[] | undefined;
  answersJson: string | null;
  score: number | null;
  maxScore: number;
}) {
  const answers: Record<string, string> = (() => {
    if (!answersJson) return {};
    try {
      const parsed = JSON.parse(answersJson);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  })();

  if (!bank || bank.length === 0) {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-4">
        <p className="text-sm text-white/50">Chargement du corrigé...</p>
      </div>
    );
  }

  const correctCount = bank.filter((q) => answers[q.id] === q.correctChoice).length;

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {qcmType === "lexique"
          ? "Bloc 1 — Partie 1 : QCM Lexique & Grammaire"
          : "Bloc 4 — Compréhension Orale (QCM)"}{" "}
        — auto-corrigé
      </p>
      <p className="mt-1 font-mono text-[11px] text-white/50">
        {correctCount}/{bank.length} bonnes réponses — {score ?? "—"}/{maxScore}
      </p>

      <div className="mt-4 space-y-4">
        {bank.map((q, i) => {
          const candidateAnswer = answers[q.id];
          return (
            <div key={q.id} className="rounded border border-white/10 bg-obsidian p-3">
              <p className="font-sans text-sm text-white/90">
                {i + 1}. {q.prompt}
              </p>
              <div className="mt-2 space-y-1">
                {q.choices.map((choice) => {
                  const isCandidateChoice = choice === candidateAnswer;
                  const isCorrectChoice = choice === q.correctChoice;
                  return (
                    <p
                      key={choice}
                      className={`rounded px-2 py-1 font-sans text-xs ${
                        isCorrectChoice
                          ? "bg-success/10 text-success"
                          : isCandidateChoice
                            ? "bg-accent/10 text-accent"
                            : "text-white/50"
                      }`}
                    >
                      {isCandidateChoice ? "→ " : ""}
                      {choice}
                      {isCorrectChoice ? " ✓" : isCandidateChoice ? " ✗" : ""}
                    </p>
                  );
                })}
              </div>
              {!candidateAnswer && (
                <p className="mt-1 font-mono text-[11px] text-white/40">Sans réponse</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SituationGrader({
  response,
  situation,
  criteria,
  onGraded,
}: {
  response: SituationResponse;
  situation: Situation | undefined;
  criteria: GradingCriterion[];
  onGraded: () => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = criteria.every((c) => levels[c.key] !== undefined);
  const previewScore = criteria.reduce((sum, c) => sum + (levels[c.key] ?? 0), 0);

  useEffect(() => {
    let objectUrl: string | null = null;
    apiGetBlob(`/evaluation/situation-responses/${response.id}/audio`, {})
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
      })
      .catch(() => setError("Audio indisponible."));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [response.id]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/evaluation/situation-responses/${response.id}/grade`, {
        criteria: levels,
      });
      onGraded();
    } catch {
      setError("Échec de l'enregistrement de la note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Situation {response.situationIndex}
        {response.gradedAt && ` — notée (${response.score}/4)`}
      </p>
      {situation && (
        <>
          <p className="mt-1 font-sans text-sm font-semibold text-white">
            Cas {situation.index} — {situation.domain}
          </p>
          <p className="mt-2 font-sans text-xs text-white/70">
            <span className="font-semibold text-white/90">Contexte&nbsp;: </span>
            {situation.context}
          </p>
          <p className="mt-1 font-sans text-xs text-white/70">
            <span className="font-semibold text-white/90">Mission&nbsp;: </span>
            {situation.mission}
          </p>
        </>
      )}

      {audioUrl ? (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      ) : (
        <p className="mt-3 text-xs text-white/50">Chargement de l&apos;audio...</p>
      )}

      <div className="mt-5 space-y-5">
        {criteria.map((c) => {
          const selectedKey =
            levels[c.key] !== undefined
              ? GRADING_LEVELS.find((l) => l.value === levels[c.key])?.key
              : undefined;
          return (
            <div key={c.key}>
              <p className="font-sans text-sm font-semibold text-white">{c.label}</p>
              <p className="text-xs text-white/50">{c.description}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GRADING_LEVELS.map((level) => (
                  <label
                    key={level.key}
                    className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                      selectedKey === level.key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/15 text-white/70 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${response.id}-${c.key}`}
                      className="sr-only"
                      checked={selectedKey === level.key}
                      onChange={() =>
                        setLevels((prev) => ({ ...prev, [c.key]: level.value }))
                      }
                    />
                    {level.label}
                    <span className="block font-mono text-[10px] text-white/50">
                      {level.value.toFixed(2)} pt
                    </span>
                  </label>
                ))}
              </div>
              {selectedKey && (
                <p className="mt-2 font-sans text-xs italic text-white/60">
                  {c.descriptors[selectedKey]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Score prévisionnel : {previewScore.toFixed(2)} / 4.00
      </p>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-4">
        <Button variant="ghostDark" onClick={save} disabled={saving || !allSelected}>
          {saving ? "Enregistrement..." : "Enregistrer la note"}
        </Button>
      </div>
    </div>
  );
}

function VideoGrader({
  response,
  task,
  criteria,
  onGraded,
}: {
  response: VideoResponse;
  task: VideoTask | undefined;
  criteria: GradingCriterion[];
  onGraded: () => void;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = criteria.every((c) => levels[c.key] !== undefined);
  const previewScore = criteria.reduce((sum, c) => sum + (levels[c.key] ?? 0), 0);

  useEffect(() => {
    let objectUrl: string | null = null;
    apiGetBlob(`/evaluation/video-responses/${response.id}/video`, {})
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);
      })
      .catch(() => setError("Vidéo indisponible."));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [response.id]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/evaluation/video-responses/${response.id}/grade`, {
        criteria: levels,
      });
      onGraded();
    } catch {
      setError("Échec de l'enregistrement de la note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Vidéo {response.taskIndex}
        {response.gradedAt && ` — notée (${response.score}/10)`}
      </p>
      {task && (
        <>
          <p className="mt-1 font-sans text-sm font-semibold text-white">{task.title}</p>
          {(() => {
            const subject = task.subjects?.find((s) => s.key === response.subjectKey);
            const chosenOption = subject?.options.find((o) => o.key === response.optionKey);

            if (subject && chosenOption) {
              return (
                <>
                  <p className="mt-2 font-sans text-xs font-semibold text-white/90">
                    Sujet : {subject.title}
                  </p>
                  {(subject.hasReferenceVideo || subject.referenceVideoEmbedUrl) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-accent">
                        Revoir le reportage de contexte
                      </summary>
                      {subject.referenceVideoEmbedUrl ? (
                        <iframe
                          src={subject.referenceVideoEmbedUrl}
                          className="mt-2 aspect-video w-full rounded"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          controls
                          preload="none"
                          src={`${API_URL}/evaluation/video-tasks/${task.index}/subjects/${subject.key}/reference-video`}
                          className="mt-2 w-full rounded"
                        />
                      )}
                    </details>
                  )}
                  <p className="mt-2 font-sans text-xs font-semibold text-accent">
                    Option {chosenOption.key} — {chosenOption.role}
                  </p>
                  <p className="mt-1 font-sans text-xs italic text-white/60">
                    {chosenOption.objectif}
                  </p>
                  <p className="mt-2 font-sans text-xs text-white/70">
                    <span className="font-semibold text-white/90">Introduction&nbsp;: </span>
                    {chosenOption.introduction}
                  </p>
                  <p className="mt-1 font-sans text-xs text-white/70">
                    <span className="font-semibold text-white/90">Développement&nbsp;: </span>
                    {chosenOption.developpement}
                  </p>
                  <p className="mt-1 font-sans text-xs text-white/70">
                    <span className="font-semibold text-white/90">Conclusion&nbsp;: </span>
                    {chosenOption.conclusion}
                  </p>
                  {subject.linguisticConstraint && (
                    <p className="mt-2 font-sans text-xs text-white/50">
                      Contrainte : au moins {subject.linguisticConstraint.minimum} termes parmi{" "}
                      {subject.linguisticConstraint.termes.join(" · ")}
                    </p>
                  )}
                </>
              );
            }
            if (task.subjects && (!response.subjectKey || !response.optionKey)) {
              return (
                <p className="mt-2 font-sans text-xs text-accent">
                  Sujet/rôle choisi non enregistré (dépôt antérieur à cette fonctionnalité).
                </p>
              );
            }
            return (
              <>
                <p className="mt-2 font-sans text-xs text-white/70">
                  <span className="font-semibold text-white/90">Contexte&nbsp;: </span>
                  {task.context}
                </p>
                <p className="mt-1 font-sans text-xs text-white/70">
                  <span className="font-semibold text-white/90">Mission&nbsp;: </span>
                  {task.mission}
                </p>
              </>
            );
          })()}
        </>
      )}

      {videoUrl ? (
        <video controls src={videoUrl} className="mt-3 w-full rounded" />
      ) : (
        <p className="mt-3 text-xs text-white/50">Chargement de la vidéo...</p>
      )}

      <div className="mt-5 space-y-5">
        {criteria.map((c) => {
          const selectedKey =
            levels[c.key] !== undefined
              ? VIDEO_GRADING_LEVELS.find((l) => l.value === levels[c.key])?.key
              : undefined;
          return (
            <div key={c.key}>
              <p className="font-sans text-sm font-semibold text-white">{c.label}</p>
              <p className="text-xs text-white/50">{c.description}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VIDEO_GRADING_LEVELS.map((level) => (
                  <label
                    key={level.key}
                    className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                      selectedKey === level.key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/15 text-white/70 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${response.id}-${c.key}`}
                      className="sr-only"
                      checked={selectedKey === level.key}
                      onChange={() =>
                        setLevels((prev) => ({ ...prev, [c.key]: level.value }))
                      }
                    />
                    {level.label}
                    <span className="block font-mono text-[10px] text-white/50">
                      {level.value.toFixed(2)} pt
                    </span>
                  </label>
                ))}
              </div>
              {selectedKey && (
                <p className="mt-2 font-sans text-xs italic text-white/60">
                  {c.descriptors[selectedKey]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Score prévisionnel : {previewScore.toFixed(2)} / 10.00
      </p>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-4">
        <Button variant="ghostDark" onClick={save} disabled={saving || !allSelected}>
          {saving ? "Enregistrement..." : "Enregistrer la note"}
        </Button>
      </div>
    </div>
  );
}

function EssayGrader({
  response,
  subject,
  criteria,
  onGraded,
}: {
  response: EssayResponse;
  subject: EssaySubject | undefined;
  criteria: GradingCriterion[];
  onGraded: () => void;
}) {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = criteria.every((c) => levels[c.key] !== undefined);
  const previewScore = criteria.reduce((sum, c) => sum + (levels[c.key] ?? 0), 0);
  const wordCountOk =
    subject && response.wordCount >= subject.minWords && response.wordCount <= subject.maxWords;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/evaluation/essay-responses/${response.id}/grade`, {
        criteria: levels,
      });
      onGraded();
    } catch {
      setError("Échec de l'enregistrement de la note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Commentaire Argumentatif
        {response.gradedAt && ` — noté (${response.score}/20)`}
      </p>
      {subject && (
        <>
          <p className="mt-1 font-sans text-sm font-semibold text-white">
            {subject.domain} — {subject.title}
          </p>
          <p className="mt-2 font-sans text-xs italic text-white/60">{subject.texte}</p>
        </>
      )}
      <p className={`mt-2 font-mono text-[11px] ${wordCountOk ? "text-success" : "text-accent"}`}>
        {response.wordCount} mots
        {subject && ` (attendu : ${subject.minWords}-${subject.maxWords})`}
      </p>

      <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-white/10 bg-obsidian p-3 font-sans text-sm text-white/80">
        {response.text}
      </div>

      <div className="mt-5 space-y-5">
        {criteria.map((c) => {
          const selectedKey =
            levels[c.key] !== undefined
              ? ESSAY_GRADING_LEVELS.find((l) => l.value === levels[c.key])?.key
              : undefined;
          return (
            <div key={c.key}>
              <p className="font-sans text-sm font-semibold text-white">{c.label}</p>
              <p className="text-xs text-white/50">{c.description}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ESSAY_GRADING_LEVELS.map((level) => (
                  <label
                    key={level.key}
                    className={`cursor-pointer rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                      selectedKey === level.key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/15 text-white/70 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${response.id}-${c.key}`}
                      className="sr-only"
                      checked={selectedKey === level.key}
                      onChange={() =>
                        setLevels((prev) => ({ ...prev, [c.key]: level.value }))
                      }
                    />
                    {level.label}
                    <span className="block font-mono text-[10px] text-white/50">
                      {level.value.toFixed(2)} pt
                    </span>
                  </label>
                ))}
              </div>
              {selectedKey && (
                <p className="mt-2 font-sans text-xs italic text-white/60">
                  {c.descriptors[selectedKey]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Score prévisionnel : {previewScore.toFixed(2)} / 20.00
      </p>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-4">
        <Button variant="ghostDark" onClick={save} disabled={saving || !allSelected}>
          {saving ? "Enregistrement..." : "Enregistrer la note"}
        </Button>
      </div>
    </div>
  );
}

// Bloc 1 — Partie 2 : contrairement aux autres blocs (échelons fixes), les
// critères ont chacun leur propre maxPoints (voir partie-ouverte.ts) — les
// boutons de notation sont donc générés dynamiquement de 0 à maxPoints par
// pas de 0,5 plutôt que de réutiliser une échelle commune.
function PartieOuverteGrader({
  response,
  content,
  criteria,
  onGraded,
}: {
  response: EcritOuvertResponse;
  content: PartieOuverteContent | null;
  criteria: PartieOuverteCriterion[];
  onGraded: () => void;
}) {
  const [points, setPoints] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = criteria.every((c) => points[c.key] !== undefined);
  const previewScore = criteria.reduce((sum, c) => sum + (points[c.key] ?? 0), 0);
  const plurielTexts: string[] = (() => {
    try {
      const parsed = JSON.parse(response.plurielTexts);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/evaluation/partie-ouverte-responses/${response.id}/grade`, {
        criteria: points,
      });
      onGraded();
    } catch {
      setError("Échec de l'enregistrement de la note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Bloc 1 — Partie 2 : Questions ouvertes et rédaction
        {response.gradedAt && ` — notée (${response.score}/10)`}
      </p>

      <div className="mt-3 space-y-3 font-sans text-sm text-white/80">
        <div>
          <p className="font-semibold text-white/90">Reformulation</p>
          <p className="mt-1 rounded border border-white/10 bg-obsidian p-2">
            {response.reformulationText || "—"}
          </p>
          {content && (
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Corrigé : {content.reformulation.corrige}
            </p>
          )}
        </div>

        <div>
          <p className="font-semibold text-white/90">Pluriels</p>
          <ul className="mt-1 space-y-1">
            {plurielTexts.map((t, i) => (
              <li key={i} className="rounded border border-white/10 bg-obsidian p-2">
                {content?.pluriels[i]?.mot} → {t || "—"}
                {content && (
                  <span className="ml-2 font-mono text-[11px] text-white/40">
                    (corrigé : {content.pluriels[i]?.corrige})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white/90">Figure de style</p>
          <p className="mt-1 rounded border border-white/10 bg-obsidian p-2">
            {response.styleText || "—"}
          </p>
          {content && (
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Corrigé : {content.stylistique.corrige}
            </p>
          )}
        </div>

        <div>
          <p className="font-semibold text-white/90">Synonyme</p>
          <p className="mt-1 rounded border border-white/10 bg-obsidian p-2">
            {response.synonymeText || "—"}
          </p>
          {content && (
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Corrigé : {content.synonyme.corrige}
            </p>
          )}
        </div>

        <div>
          <p className="font-semibold text-white/90">
            Rédaction ({response.redactionWordCount} mots)
          </p>
          <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-white/10 bg-obsidian p-2">
            {response.redactionText || "—"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {criteria.map((c) => {
          const levelValues: number[] = [];
          for (let v = 0; v <= c.maxPoints + 1e-9; v += 0.5) {
            levelValues.push(Math.round(v * 2) / 2);
          }
          const selected = points[c.key];
          return (
            <div key={c.key}>
              <p className="font-sans text-sm font-semibold text-white">{c.label}</p>
              <p className="text-xs text-white/50">{c.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {levelValues.map((v) => (
                  <label
                    key={v}
                    className={`cursor-pointer rounded border px-2.5 py-1.5 text-center text-xs transition-colors ${
                      selected === v
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-white/15 text-white/70 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${response.id}-${c.key}`}
                      className="sr-only"
                      checked={selected === v}
                      onChange={() => setPoints((prev) => ({ ...prev, [c.key]: v }))}
                    />
                    {v.toFixed(1)}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Score prévisionnel : {previewScore.toFixed(2)} / 10.00
      </p>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}

      <div className="mt-4">
        <Button variant="ghostDark" onClick={save} disabled={saving || !allSelected}>
          {saving ? "Enregistrement..." : "Enregistrer la note"}
        </Button>
      </div>
    </div>
  );
}
