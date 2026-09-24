"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/Reveal";
import AudioRecorder from "./AudioRecorder";
import VideoRecorder from "./VideoRecorder";
import { apiGet, apiPost, apiUpload, ApiError } from "@/lib/api";

const REQUIRED_SITUATIONS = 5;

// Vidéo de contexte diffusée en direct (Range requests natives, pas de
// blob chargé en mémoire) — endpoint public, pas besoin de passer par
// apiGetBlob comme pour les enregistrements des candidats.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface QcmQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

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
  reformulation: { consigne: string; phrase: string; starter: string };
  pluriels: { mot: string }[];
  stylistique: { phrase: string; question: string };
  synonyme: { phrase: string; mot: string };
  redaction: { sujet: string; consignes: string[]; minWords: number; maxWords: number };
}

type Step =
  | "coordonnees"
  | "intro"
  | "menu"
  | "lexique"
  | "partie-ouverte"
  | "oral"
  | "select-situations"
  | "record-situations"
  | "record-videos"
  | "essay"
  | "confirmation";

const initialCoordonnees = { firstName: "", lastName: "", email: "", phone: "", agentAcquisitionId: "" };

interface AgentAcquisition {
  id: string;
  nom: string;
}

// Architecture officielle du test (100 pts, 5 blocs de 20 pts) — les 5 blocs
// sont désormais tous construits (Bloc 2 ajouté le 2026-08-25).
const EVALUATION_BLOCKS = [
  {
    number: 1,
    title: "Fondamentaux, Grammaire, Lexique & Compréhension Écrite",
    available: true,
  },
  { number: 2, title: "Commentaire Argumentatif", available: true },
  {
    number: 3,
    title: "10 Mises en Situation Orales (Enregistrements audio)",
    available: true,
  },
  {
    number: 4,
    title: "Compréhension Orale (Vidéo + QCM)",
    available: true,
  },
  {
    number: 5,
    title: "Production Vidéo (Débat Plateau Télé & Pitch Synthèse)",
    available: true,
  },
];

interface EvaluationQuestions {
  lexique: QcmQuestion[];
  oral: QcmQuestion[];
  // Vidéo support du Bloc 4 (voir ORAL_MEDIA côté backend, questions.ts).
  oralMedia?: { embedUrl: string; sourceUrl: string };
}

// Affiche une question à la fois plutôt que la liste complète du bloc — plus
// digeste pour le candidat qu'un long formulaire à faire défiler (retour
// client, 2026-08-04).
function QcmBlock({
  title,
  questions,
  answers,
  onChange,
  onNext,
  nextLabel,
}: {
  title: string;
  questions: QcmQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const [current, setCurrent] = useState(0);
  const question = questions[current];
  const isLast = current === questions.length - 1;
  const answered = !!answers[question.id];

  function goNext() {
    if (isLast) {
      onNext();
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="font-mono text-xs text-white/40">
          {current + 1} / {questions.length}
        </p>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="mt-6">
        <p className="font-sans text-sm text-white/90">{question.prompt}</p>
        <div className="mt-3 space-y-2">
          {question.choices.map((choice) => (
            <label
              key={choice}
              className="flex cursor-pointer items-center gap-2 text-sm text-white/70"
            >
              <input
                type="radio"
                name={question.id}
                className="h-4 w-4 accent-accent"
                checked={answers[question.id] === choice}
                onChange={() => onChange(question.id, choice)}
              />
              {choice}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {current > 0 ? (
          <Button variant="ghostDark" onClick={() => setCurrent((c) => c - 1)}>
            Précédent
          </Button>
        ) : (
          <span />
        )}
        <Button variant="dark" onClick={goNext} disabled={!answered}>
          {isLast ? nextLabel : "Suivant"}
        </Button>
      </div>
    </div>
  );
}

export default function EvaluationFlow() {
  const [step, setStep] = useState<Step>("coordonnees");
  const [coordonnees, setCoordonnees] = useState(initialCoordonnees);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentAcquisition[]>([]);

  const [questions, setQuestions] = useState<EvaluationQuestions | null>(null);
  // Bloc 4 : la vidéo est visionnée d'abord, les questions ensuite.
  const [oralVideoSeen, setOralVideoSeen] = useState(false);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [essaySubjects, setEssaySubjects] = useState<EssaySubject[]>([]);
  const [partieOuverteContent, setPartieOuverteContent] = useState<PartieOuverteContent | null>(
    null
  );
  const [lexiqueAnswers, setLexiqueAnswers] = useState<Record<string, string>>({});
  const [oralAnswers, setOralAnswers] = useState<Record<string, string>>({});
  const [selectedSituations, setSelectedSituations] = useState<number[]>([]);
  const [recordingCursor, setRecordingCursor] = useState(0);
  const [videoCursor, setVideoCursor] = useState(0);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [selectedEssaySubjectKey, setSelectedEssaySubjectKey] = useState<string | null>(null);
  const [essayText, setEssayText] = useState("");
  const [reformulationText, setReformulationText] = useState("");
  const [plurielTexts, setPlurielTexts] = useState(["", "", ""]);
  const [styleText, setStyleText] = useState("");
  const [synonymeText, setSynonymeText] = useState("");
  const [redactionText, setRedactionText] = useState("");

  // Les 5 blocs construits sont indépendants et se font dans l'ordre choisi
  // par le candidat depuis le menu (step "menu") — ces flags pilotent
  // l'affichage "Terminé" de chaque tuile et l'activation du bouton final.
  const [lexiqueSubmitted, setLexiqueSubmitted] = useState(false);
  const [oralSubmitted, setOralSubmitted] = useState(false);
  const [situationsDone, setSituationsDone] = useState(false);
  const [videosDone, setVideosDone] = useState(false);
  const [essayDone, setEssayDone] = useState(false);
  const allBlocksDone =
    lexiqueSubmitted && oralSubmitted && situationsDone && videosDone && essayDone;

  useEffect(() => {
    apiGet<EvaluationQuestions>("/evaluation/questions")
      .then(setQuestions)
      .catch(() => setError("Impossible de charger les épreuves."));
    apiGet<Situation[]>("/evaluation/situations")
      .then(setSituations)
      .catch(() => setError("Impossible de charger les situations."));
    apiGet<VideoTask[]>("/evaluation/video-tasks")
      .then(setVideoTasks)
      .catch(() => setError("Impossible de charger les tâches vidéo."));
    apiGet<EssaySubject[]>("/evaluation/essay-subjects")
      .then(setEssaySubjects)
      .catch(() => setError("Impossible de charger les sujets de commentaire argumenté."));
    apiGet<PartieOuverteContent>("/evaluation/partie-ouverte")
      .then(setPartieOuverteContent)
      .catch(() => setError("Impossible de charger la partie 2 du Bloc 1."));
    // Facultatif — un échec ici ne doit pas bloquer le test, juste priver le
    // candidat du menu "recommandé par" (voir AgentAcquisition côté RH).
    apiGet<AgentAcquisition[]>("/evaluation/agents-acquisition")
      .then(setAgents)
      .catch(() => {});
  }, []);

  async function handleCoordonneesSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<{ candidatId: string; attemptId: string }>(
        "/evaluation/candidats",
        { ...coordonnees, agentAcquisitionId: coordonnees.agentAcquisitionId || undefined }
      );
      if (cvFile) {
        // Dépôt optionnel — un échec ici ne doit pas bloquer le candidat qui
        // vient de créer son dossier, le CV pourra être redéposé plus tard.
        const formData = new FormData();
        formData.append("cv", cvFile, cvFile.name);
        await apiUpload(`/evaluation/candidats/${res.candidatId}/cv`, formData).catch(() => {});
      }
      setAttemptId(res.attemptId);
      setStep("intro");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue."
      );
    }
  }

  function toggleSituation(index: number) {
    setSelectedSituations((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= REQUIRED_SITUATIONS) return prev;
      return [...prev, index];
    });
  }

  // Bloc 1 et Bloc 4 se soumettent chacun indépendamment (voir
  // SubmitAnswersDto côté back, qui accepte l'un ou l'autre séparément) —
  // le candidat peut faire les 4 blocs construits dans l'ordre de son
  // choix depuis le menu, pas de second appel groupé à la fin.
  async function handleLexiqueSubmit() {
    if (!attemptId) return;
    setError(null);
    try {
      await apiPost(`/evaluation/attempts/${attemptId}/submit`, { lexiqueAnswers });
      // Le Bloc 1 QCM enchaîne directement sur la Partie 2 (questions
      // ouvertes) — lexiqueSubmitted ne passe à true qu'une fois les deux
      // parties envoyées (voir handlePartieOuverteSubmit).
      setStep("partie-ouverte");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue à la soumission."
      );
    }
  }

  async function handlePartieOuverteSubmit() {
    if (!attemptId) return;
    setError(null);
    try {
      await apiPost(`/evaluation/attempts/${attemptId}/partie-ouverte`, {
        reformulationText,
        plurielTexts,
        styleText,
        synonymeText,
        redactionText,
      });
      setLexiqueSubmitted(true);
      setStep("menu");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue à la soumission."
      );
    }
  }

  async function handleOralSubmit() {
    if (!attemptId) return;
    setError(null);
    try {
      await apiPost(`/evaluation/attempts/${attemptId}/submit`, { oralAnswers });
      setOralSubmitted(true);
      setStep("menu");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue à la soumission."
      );
    }
  }

  async function handleRecorded(blob: Blob) {
    if (!attemptId) return;
    const situationIndex = selectedSituations[recordingCursor];
    const formData = new FormData();
    formData.append("situationIndex", String(situationIndex));
    formData.append("audio", blob, `situation-${situationIndex}.webm`);

    try {
      await apiUpload(`/evaluation/attempts/${attemptId}/situations`, formData);

      if (recordingCursor + 1 < selectedSituations.length) {
        setRecordingCursor((c) => c + 1);
      } else {
        setSituationsDone(true);
        setStep("menu");
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Échec de l'envoi de l'enregistrement."
      );
    }
  }

  async function handleVideoRecorded(blob: Blob, filename: string) {
    if (!attemptId) return;
    const task = videoTasks[videoCursor];
    if (!task) return;
    const formData = new FormData();
    formData.append("taskIndex", String(task.index));
    if (selectedSubjectKey) formData.append("subjectKey", selectedSubjectKey);
    if (selectedOptionKey) formData.append("optionKey", selectedOptionKey);
    formData.append("video", blob, filename);

    try {
      await apiUpload(`/evaluation/attempts/${attemptId}/videos`, formData);

      setSelectedSubjectKey(null);
      setSelectedOptionKey(null);
      if (videoCursor + 1 < videoTasks.length) {
        setVideoCursor((c) => c + 1);
      } else {
        setVideosDone(true);
        setStep("menu");
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Échec de l'envoi de la vidéo."
      );
    }
  }

  async function handleEssaySubmit() {
    if (!attemptId || !selectedEssaySubjectKey) return;
    setError(null);
    try {
      await apiPost(`/evaluation/attempts/${attemptId}/essay`, {
        subjectKey: selectedEssaySubjectKey,
        text: essayText,
      });
      setEssayDone(true);
      setSelectedEssaySubjectKey(null);
      setEssayText("");
      setStep("menu");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Échec de l'envoi du commentaire argumenté."
      );
    }
  }

  if (step === "coordonnees") {
    return (
      <form
        onSubmit={handleCoordonneesSubmit}
        className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6"
      >
        <h2 className="font-display text-xl font-semibold text-white">
          Vos coordonnées
        </h2>
        <p className="mt-2 font-sans text-sm text-white/70">
          Avant de passer le test, merci de renseigner vos coordonnées.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Prénom"
            className="rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent"
            value={coordonnees.firstName}
            onChange={(e) =>
              setCoordonnees((v) => ({ ...v, firstName: e.target.value }))
            }
          />
          <input
            required
            placeholder="Nom"
            className="rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent"
            value={coordonnees.lastName}
            onChange={(e) =>
              setCoordonnees((v) => ({ ...v, lastName: e.target.value }))
            }
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent sm:col-span-2"
            value={coordonnees.email}
            onChange={(e) =>
              setCoordonnees((v) => ({ ...v, email: e.target.value }))
            }
          />
          <input
            required
            type="tel"
            placeholder="Téléphone"
            className="rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent sm:col-span-2"
            value={coordonnees.phone}
            onChange={(e) =>
              setCoordonnees((v) => ({ ...v, phone: e.target.value }))
            }
          />
          {agents.length > 0 && (
            <div className="sm:col-span-2">
              <label className="block font-sans text-xs text-white/60">
                Recommandé par (facultatif)
              </label>
              <select
                className="mt-1 w-full rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent"
                value={coordonnees.agentAcquisitionId}
                onChange={(e) =>
                  setCoordonnees((v) => ({ ...v, agentAcquisitionId: e.target.value }))
                }
              >
                <option value="">— Personne / je ne sais pas —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block font-sans text-xs text-white/60">
              CV (PDF, facultatif)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-white/70 file:mr-3 file:rounded file:border file:border-white/20 file:bg-obsidian file:px-3 file:py-1.5 file:text-xs file:text-white file:outline-none"
            />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <div className="mt-6">
          <Button type="submit" variant="dark">
            Continuer
          </Button>
        </div>
      </form>
    );
  }

  if (step === "intro") {
    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Avant de commencer
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">
          Architecture de l&apos;évaluation (100 points)
        </h2>
        <p className="mt-3 font-sans text-sm text-white/70">
          Ce test évalue vos compétences communicatives en français
          professionnel. Il est structuré en 5 blocs indépendants valant
          chacun 20 points.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {EVALUATION_BLOCKS.map((block) => (
            <div
              key={block.number}
              className={`flex items-start gap-3 rounded border p-3 ${
                block.available
                  ? "border-white/10 bg-obsidian"
                  : "border-dashed border-white/10 bg-obsidian/50"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 font-mono text-xs font-bold text-accent">
                {block.number}
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white">
                  Bloc {block.number} (20 pts)
                </p>
                <p className="mt-0.5 font-sans text-xs text-white/60">
                  {block.title}
                </p>
                {!block.available && (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Bientôt disponible
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 font-sans text-sm text-white/70">
          Ce test couvre les 5 blocs (100 points).{" "}
          <strong className="text-white">
            Toutes les épreuves présentées sont obligatoires
          </strong>
          , mais vous pouvez les faire dans l&apos;ordre de votre choix.
        </p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Le résultat ne vous sera pas communiqué immédiatement. Si votre dossier est retenu, vous
          recevrez par e-mail votre résultat ainsi que votre contrat de formation (durée, frais,
          conditions) et la marche à suivre pour finaliser votre inscription.
        </p>
        <div className="mt-6 text-center">
          <Button variant="dark" onClick={() => setStep("menu")}>
            Commencer le test
          </Button>
        </div>
      </div>
    );
  }

  if (!questions) {
    return <p className="text-center text-white/60">Chargement des épreuves...</p>;
  }

  if (step === "menu") {
    const tiles: {
      number: number;
      title: string;
      done: boolean;
      onClick?: () => void;
    }[] = [
      {
        number: 1,
        title: "Lexique, Grammaire & Compréhension Écrite",
        done: lexiqueSubmitted,
        onClick: () => setStep("lexique"),
      },
      {
        number: 2,
        title: "Commentaire Argumentatif",
        done: essayDone,
        onClick: () => {
          setSelectedEssaySubjectKey(null);
          setEssayText("");
          setStep("essay");
        },
      },
      {
        number: 3,
        title: "Mises en situation professionnelles",
        done: situationsDone,
        onClick: () => setStep("select-situations"),
      },
      {
        number: 4,
        title: "Compréhension Orale (Vidéo + QCM)",
        done: oralSubmitted,
        onClick: () => setStep("oral"),
      },
      {
        number: 5,
        title: "Production Vidéo (Débat Plateau Télé & Pitch Synthèse)",
        done: videosDone,
        onClick: () => {
          setVideoCursor(0);
          setSelectedSubjectKey(null);
          setSelectedOptionKey(null);
          setStep("record-videos");
        },
      },
    ];

    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Menu du test
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">
          Choisissez un bloc à faire
        </h2>
        <p className="mt-2 font-sans text-sm text-white/70">
          Les 4 blocs sont indépendants — faites-les dans l&apos;ordre que vous
          voulez. Vous pouvez revenir ici entre chaque bloc.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {tiles.map((tile) => (
            <button
              key={tile.number}
              onClick={tile.onClick}
              className={`flex items-start gap-3 rounded border p-3 text-left transition-colors ${
                tile.done
                  ? "border-success/40 bg-success/5 hover:border-success/60"
                  : "border-white/10 bg-obsidian hover:border-accent/50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${
                  tile.done ? "border-success/60 text-success" : "border-accent/40 text-accent"
                }`}
              >
                {tile.done ? "✓" : tile.number}
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white">
                  Bloc {tile.number} (20 pts)
                </p>
                <p className="mt-0.5 font-sans text-xs text-white/60">{tile.title}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {tile.done ? "Terminé — modifiable" : "À faire"}
                </p>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}

        <div className="mt-6 text-center">
          <Button variant="dark" disabled={!allBlocksDone} onClick={() => setStep("confirmation")}>
            {allBlocksDone
              ? "Terminer et envoyer mon test"
              : "Terminez les 5 blocs pour envoyer votre test"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "lexique") {
    return (
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => setStep("menu")}
          className="mb-3 font-sans text-xs text-accent hover:underline"
        >
          ← Retour au menu
        </button>
        <QcmBlock
          key="lexique"
          title="Bloc 1 — Lexique, Grammaire & Compréhension Écrite"
          questions={questions.lexique}
          answers={lexiqueAnswers}
          onChange={(id, v) => setLexiqueAnswers((a) => ({ ...a, [id]: v }))}
          onNext={handleLexiqueSubmit}
          nextLabel="Continuer vers la partie 2"
        />
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>
    );
  }

  if (step === "partie-ouverte") {
    if (!partieOuverteContent) {
      return <p className="text-center text-white/60">Chargement de la partie 2...</p>;
    }
    const redactionWordCount = redactionText.trim().split(/\s+/).filter(Boolean).length;
    const redactionWordCountOk =
      redactionWordCount >= partieOuverteContent.redaction.minWords &&
      redactionWordCount <= partieOuverteContent.redaction.maxWords;
    const partieOuverteComplete =
      reformulationText.trim().length > 0 &&
      plurielTexts.every((t) => t.trim().length > 0) &&
      styleText.trim().length > 0 &&
      synonymeText.trim().length > 0 &&
      redactionText.trim().length > 0;

    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setStep("menu")}
          className="mb-3 block font-sans text-xs text-accent hover:underline"
        >
          ← Retour au menu
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Bloc 1 — Partie 2 : Questions ouvertes et rédaction
        </p>

        <div className="mt-6">
          <h3 className="font-display text-base font-semibold text-white">
            Exercice 1 — Reformulation & Inversion
          </h3>
          <p className="mt-2 font-sans text-sm text-white/80">
            {partieOuverteContent.reformulation.consigne}
          </p>
          <p className="mt-2 font-sans text-sm italic text-white/60">
            « {partieOuverteContent.reformulation.phrase} »
          </p>
          <div className="mt-3 flex items-start gap-2">
            <span className="mt-2 shrink-0 font-sans text-sm text-white/80">
              {partieOuverteContent.reformulation.starter}
            </span>
            <textarea
              value={reformulationText}
              onChange={(e) => setReformulationText(e.target.value)}
              rows={2}
              className="w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <p className="mt-5 font-sans text-sm text-white/80">
            Mettez les termes suivants au pluriel :
          </p>
          <div className="mt-2 space-y-2">
            {partieOuverteContent.pluriels.map((p, i) => (
              <div key={p.mot} className="flex items-center gap-2">
                <span className="w-40 shrink-0 font-sans text-sm text-white/70">{p.mot} →</span>
                <input
                  value={plurielTexts[i]}
                  onChange={(e) =>
                    setPlurielTexts((arr) => arr.map((t, idx) => (idx === i ? e.target.value : t)))
                  }
                  className="w-full rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="font-display text-base font-semibold text-white">
            Exercice 2 — Stylistique
          </h3>
          <p className="mt-2 font-sans text-sm italic text-white/60">
            {partieOuverteContent.stylistique.phrase}
          </p>
          <p className="mt-2 font-sans text-sm text-white/80">
            {partieOuverteContent.stylistique.question}
          </p>
          <input
            value={styleText}
            onChange={(e) => setStyleText(e.target.value)}
            className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
          />

          <p className="mt-5 font-sans text-sm text-white/80">
            Proposez un synonyme soutenu pour remplacer le mot «&nbsp;
            {partieOuverteContent.synonyme.mot}&nbsp;» dans la phrase&nbsp;:
          </p>
          <p className="mt-1 font-sans text-sm italic text-white/60">
            {partieOuverteContent.synonyme.phrase}
          </p>
          <input
            value={synonymeText}
            onChange={(e) => setSynonymeText(e.target.value)}
            className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
          />
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="font-display text-base font-semibold text-white">
            Exercice 3 — Expression écrite argumentée
          </h3>
          <p className="mt-2 font-sans text-sm text-white/80">
            {partieOuverteContent.redaction.sujet}
          </p>
          <ul className="mt-2 list-inside list-disc font-sans text-xs text-white/60">
            {partieOuverteContent.redaction.consignes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <textarea
            value={redactionText}
            onChange={(e) => setRedactionText(e.target.value)}
            rows={10}
            placeholder="Rédigez votre réponse ici..."
            className="mt-3 w-full rounded border border-white/20 bg-obsidian px-4 py-3 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
          />
          <p
            className={`mt-2 font-mono text-xs ${
              redactionWordCountOk ? "text-success" : "text-white/50"
            }`}
          >
            {redactionWordCount} mots (entre {partieOuverteContent.redaction.minWords} et{" "}
            {partieOuverteContent.redaction.maxWords} attendus)
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}

        <div className="mt-6">
          <Button
            variant="dark"
            onClick={handlePartieOuverteSubmit}
            disabled={!partieOuverteComplete}
          >
            Valider ce bloc
          </Button>
        </div>
      </div>
    );
  }

  if (step === "oral") {
    const media = questions.oralMedia;
    // Premier écran : la vidéo seule, puis les questions — le candidat
    // regarde le support avant de découvrir le QCM (consigne cliente du
    // 2026-09-24). Il peut revenir revoir la vidéo depuis les questions.
    if (media && !oralVideoSeen) {
      return (
        <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
          <button
            onClick={() => setStep("menu")}
            className="mb-3 block font-sans text-xs text-accent hover:underline"
          >
            ← Retour au menu
          </button>
          <h3 className="font-display text-lg font-semibold text-white">
            Bloc 4 — Compréhension Orale (Vidéo + QCM)
          </h3>
          <p className="mt-2 font-sans text-sm text-white/70">
            Regardez attentivement la vidéo ci-dessous, puis répondez aux {questions.oral.length}{" "}
            questions. Vous pourrez la revoir pendant le questionnaire.
          </p>
          <iframe
            src={media.embedUrl}
            title="Vidéo du Bloc 4"
            className="mx-auto mt-4 aspect-[9/16] w-full max-w-xs rounded border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
          <p className="mt-2 text-center font-sans text-xs text-white/50">
            La vidéo ne s&apos;affiche pas ?{" "}
            <a
              href={media.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Ouvrir sur Facebook
            </a>
          </p>
          <div className="mt-6">
            <Button variant="dark" onClick={() => setOralVideoSeen(true)}>
              J&apos;ai regardé la vidéo — passer aux questions
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setStep("menu")}
            className="font-sans text-xs text-accent hover:underline"
          >
            ← Retour au menu
          </button>
          {media && (
            <button
              onClick={() => setOralVideoSeen(false)}
              className="font-sans text-xs text-accent hover:underline"
            >
              Revoir la vidéo
            </button>
          )}
        </div>
        <QcmBlock
          key="oral"
          title="Bloc 4 — Compréhension Orale (Vidéo + QCM)"
          questions={questions.oral}
          answers={oralAnswers}
          onChange={(id, v) => setOralAnswers((a) => ({ ...a, [id]: v }))}
          onNext={handleOralSubmit}
          nextLabel="Valider ce bloc"
        />
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>
    );
  }

  if (step === "select-situations") {
    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setStep("menu")}
          className="mb-3 font-sans text-xs text-accent hover:underline"
        >
          ← Retour au menu
        </button>
        <h3 className="font-display text-lg font-semibold text-white">
          Bloc 3 — Mises en situation professionnelles
        </h3>
        <p className="mt-2 font-sans text-sm text-white/70">
          Choisissez exactement {REQUIRED_SITUATIONS} situations parmi les 10
          proposées. Vous enregistrerez une réponse audio de 1 à 2 minutes par
          situation choisie.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {situations.map((s) => (
            <label
              key={s.index}
              className="flex cursor-pointer items-start gap-2 rounded border border-white/10 bg-obsidian p-3 text-sm text-white/80"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-accent"
                checked={selectedSituations.includes(s.index)}
                onChange={() => toggleSituation(s.index)}
              />
              <span>
                <span className="block font-semibold text-accent">
                  Cas {s.index} — {s.domain}
                </span>
                {s.mission}
              </span>
            </label>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <div className="mt-6">
          <Button
            variant="dark"
            disabled={selectedSituations.length !== REQUIRED_SITUATIONS}
            onClick={() => {
              setRecordingCursor(0);
              setStep("record-situations");
            }}
          >
            Commencer les enregistrements ({selectedSituations.length}/
            {REQUIRED_SITUATIONS})
          </Button>
        </div>
      </div>
    );
  }

  if (step === "record-situations") {
    const situationIndex = selectedSituations[recordingCursor];
    const situation = situations.find((s) => s.index === situationIndex);
    return (
      <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setStep("menu")}
          className="mb-3 block font-sans text-xs text-accent hover:underline"
        >
          ← Retour au menu
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Situation {recordingCursor + 1} / {REQUIRED_SITUATIONS}
        </p>
        <p className="mt-2 font-display text-sm font-semibold text-white">
          Cas {situation?.index} — {situation?.domain}
        </p>
        <p className="mt-3 font-sans text-sm text-white/80">
          <span className="font-semibold text-white">Contexte&nbsp;: </span>
          {situation?.context}
        </p>
        <p className="mt-3 font-sans text-sm text-white/80">
          <span className="font-semibold text-white">Votre mission&nbsp;: </span>
          {situation?.mission}
        </p>
        <p className="mt-3 font-sans text-xs text-white/50">
          Enregistrement de 1 à 2 minutes maximum.
        </p>
        <div className="mt-6">
          <AudioRecorder key={situationIndex} onRecorded={handleRecorded} />
        </div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>
    );
  }

  if (step === "record-videos") {
    const task = videoTasks[videoCursor];
    const chosenSubject = task?.subjects?.find((s) => s.key === selectedSubjectKey);
    const chosenOption = chosenSubject?.options.find((o) => o.key === selectedOptionKey);

    // Tâche avec choix de sujet (ex. Débat Plateau Télé) : premier écran —
    // sélection du sujet de débat, avant même le choix de rôle.
    if (task?.subjects && !chosenSubject) {
      return (
        <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
          <button
            onClick={() => setStep("menu")}
            className="mb-3 block font-sans text-xs text-accent hover:underline"
          >
            ← Retour au menu
          </button>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Bloc 5 — Vidéo {videoCursor + 1} / {videoTasks.length}
          </p>
          <p className="mt-2 font-display text-sm font-semibold text-white">{task.title}</p>
          <p className="mt-3 font-sans text-sm text-white/80">{task.context}</p>

          <div className="mt-5 space-y-3">
            {task.subjects.map((subject) => (
              <button
                key={subject.key}
                onClick={() => setSelectedSubjectKey(subject.key)}
                className="w-full rounded border border-white/15 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/60"
              >
                <p className="font-sans text-sm font-semibold text-white">{subject.title}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Deuxième écran — choix de rôle au sein du sujet choisi, avec la vidéo
    // de contexte propre à ce sujet (hébergée par nous, ou intégrée en
    // iframe depuis une source externe qui l'autorise, ex. TV5Monde).
    if (chosenSubject && !chosenOption) {
      return (
        <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
          <button
            onClick={() => setSelectedSubjectKey(null)}
            className="mb-3 block font-sans text-xs text-accent hover:underline"
          >
            ← Changer de sujet
          </button>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Bloc 5 — Vidéo {videoCursor + 1} / {videoTasks.length}
          </p>
          <p className="mt-2 font-display text-sm font-semibold text-white">{chosenSubject.title}</p>
          <p className="mt-3 font-sans text-sm text-white/80">{chosenSubject.context}</p>

          {(chosenSubject.hasReferenceVideo || chosenSubject.referenceVideoEmbedUrl) && (
            <div className="mt-4">
              <p className="font-sans text-xs font-semibold text-white/80">
                Regardez ce reportage avant de choisir votre rôle :
              </p>
              {chosenSubject.referenceVideoEmbedUrl ? (
                <iframe
                  src={chosenSubject.referenceVideoEmbedUrl}
                  className="mt-2 aspect-video w-full rounded"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  preload="metadata"
                  src={`${API_URL}/evaluation/video-tasks/${task.index}/subjects/${chosenSubject.key}/reference-video`}
                  className="mt-2 w-full rounded"
                />
              )}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {chosenSubject.options.map((option) => (
              <button
                key={option.key}
                onClick={() => setSelectedOptionKey(option.key)}
                className="w-full rounded border border-white/15 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/60"
              >
                <p className="font-sans text-sm font-semibold text-white">
                  Option {option.key} — {option.role}
                </p>
                <p className="mt-1 font-sans text-xs text-white/60">{option.objectif}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setStep("menu")}
          className="mb-3 block font-sans text-xs text-accent hover:underline"
        >
          ← Retour au menu
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Bloc 5 — Vidéo {videoCursor + 1} / {videoTasks.length}
        </p>
        <p className="mt-2 font-display text-sm font-semibold text-white">
          {task?.title}
        </p>

        {chosenOption ? (
          <>
            <button
              onClick={() => setSelectedOptionKey(null)}
              className="mt-2 font-sans text-xs text-accent hover:underline"
            >
              ← Changer de rôle
            </button>
            <p className="mt-3 font-sans text-sm font-semibold text-white">
              Option {chosenOption.key} — {chosenOption.role}
            </p>
            <p className="mt-1 font-sans text-xs italic text-white/60">{chosenOption.objectif}</p>
            <div className="mt-3 space-y-2 font-sans text-sm text-white/80">
              <p>
                <span className="font-semibold text-white">Introduction (~30s)&nbsp;: </span>
                {chosenOption.introduction}
              </p>
              <p>
                <span className="font-semibold text-white">Développement (~1min30)&nbsp;: </span>
                {chosenOption.developpement}
              </p>
              <p>
                <span className="font-semibold text-white">Conclusion (~1min)&nbsp;: </span>
                {chosenOption.conclusion}
              </p>
            </div>
            {chosenSubject?.linguisticConstraint && (
              <div className="mt-4 rounded border border-accent/30 bg-accent/5 p-3">
                <p className="font-sans text-xs font-semibold text-white">
                  {chosenSubject.linguisticConstraint.intro}
                </p>
                <ul className="mt-2 space-y-1 font-sans text-xs text-white/70">
                  {chosenSubject.linguisticConstraint.termes.map((terme) => (
                    <li key={terme}>• {terme}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 font-sans text-sm text-white/80">
              <span className="font-semibold text-white">Contexte&nbsp;: </span>
              {task?.context}
            </p>
            <p className="mt-3 font-sans text-sm text-white/80">
              <span className="font-semibold text-white">Votre mission&nbsp;: </span>
              {task?.mission}
            </p>
          </>
        )}

        {task && (
          <p className="mt-3 font-sans text-xs text-white/50">
            Enregistrement de {Math.floor(task.maxSeconds / 60)} minute
            {task.maxSeconds >= 120 ? "s" : ""} maximum.
          </p>
        )}
        <div className="mt-6">
          {task && (
            <VideoRecorder
              key={`${task.index}-${chosenSubject?.key ?? "none"}-${chosenOption?.key ?? "none"}`}
              onRecorded={handleVideoRecorded}
              maxSeconds={task.maxSeconds}
            />
          )}
        </div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>
    );
  }

  if (step === "essay") {
    const chosenEssaySubject = essaySubjects.find((s) => s.key === selectedEssaySubjectKey);

    // Écran de choix du sujet (le candidat en choisit UN parmi les 3).
    if (!chosenEssaySubject) {
      return (
        <div className="mx-auto max-w-lg rounded border border-white/10 bg-obsidianCard p-6">
          <button
            onClick={() => setStep("menu")}
            className="mb-3 block font-sans text-xs text-accent hover:underline"
          >
            ← Retour au menu
          </button>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Bloc 2 — Commentaire Argumentatif
          </p>
          <p className="mt-2 font-sans text-sm text-white/80">
            Choisissez un sujet parmi les {essaySubjects.length} proposés.
          </p>

          <div className="mt-5 space-y-3">
            {essaySubjects.map((subject) => (
              <button
                key={subject.key}
                onClick={() => setSelectedEssaySubjectKey(subject.key)}
                className="w-full rounded border border-white/15 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/60"
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  {subject.domain}
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-white">{subject.title}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
    const wordCountOk =
      wordCount >= chosenEssaySubject.minWords && wordCount <= chosenEssaySubject.maxWords;

    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6">
        <button
          onClick={() => setSelectedEssaySubjectKey(null)}
          className="mb-3 block font-sans text-xs text-accent hover:underline"
        >
          ← Changer de sujet
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Bloc 2 — {chosenEssaySubject.domain}
        </p>
        <p className="mt-2 font-display text-base font-semibold text-white">
          {chosenEssaySubject.title}
        </p>
        <p className="mt-3 whitespace-pre-line font-sans text-sm italic text-white/70">
          {chosenEssaySubject.texte}
        </p>
        <p className="mt-3 font-sans text-sm text-white/80">
          <span className="font-semibold text-white">Consigne&nbsp;: </span>
          {chosenEssaySubject.consigne}
        </p>

        <textarea
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          rows={14}
          placeholder="Rédigez votre essai ici..."
          className="mt-4 w-full rounded border border-white/20 bg-obsidian px-4 py-3 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
        />
        <p
          className={`mt-2 font-mono text-xs ${wordCountOk ? "text-success" : "text-white/50"}`}
        >
          {wordCount} mots (entre {chosenEssaySubject.minWords} et {chosenEssaySubject.maxWords}{" "}
          attendus)
        </p>

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}

        <div className="mt-4">
          <Button variant="dark" onClick={handleEssaySubmit} disabled={essayText.trim().length === 0}>
            Valider ce bloc
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Reveal>
      <div className="mx-auto max-w-lg rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-white">
          Merci, {coordonnees.firstName} !
        </h2>
        <p className="mt-3 font-sans text-sm text-white/70">
          Votre test a bien été enregistré. Notre équipe l&apos;examine avec attention : si votre
          dossier est retenu, vous recevrez par e-mail votre résultat ainsi que votre contrat de
          formation et les prochaines étapes pour finaliser votre inscription.
        </p>
      </div>
    </Reveal>
  );
}
