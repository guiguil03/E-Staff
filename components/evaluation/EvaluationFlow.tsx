"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/Reveal";
import AudioRecorder from "./AudioRecorder";
import { apiGet, apiPost, apiUpload, ApiError } from "@/lib/api";

const REQUIRED_SITUATIONS = 5;

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

type Step =
  | "coordonnees"
  | "intro"
  | "lexique"
  | "oral"
  | "select-situations"
  | "record-situations"
  | "submitting"
  | "confirmation";

const initialCoordonnees = { firstName: "", lastName: "", email: "", phone: "" };

// Architecture officielle du test (100 pts, 5 blocs de 20 pts). Seuls les
// Blocs 1, 3 et 4 sont construits pour l'instant — les Blocs 2 et 5
// n'existent pas encore côté produit (voir mémoire de session 2026-08-04).
const EVALUATION_BLOCKS = [
  {
    number: 1,
    title: "Fondamentaux, Grammaire, Lexique & Compréhension Écrite",
    available: true,
  },
  { number: 2, title: "Commentaire Argumentatif", available: false },
  {
    number: 3,
    title: "10 Mises en Situation Orales (Enregistrements audio)",
    available: true,
  },
  {
    number: 4,
    title: "Compréhension Orale (Podcasts B2 & C1)",
    available: true,
  },
  {
    number: 5,
    title: "Production Vidéo (Débat Plateau Télé & Pitch Synthèse)",
    available: false,
  },
];

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
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<{
    lexique: QcmQuestion[];
    oral: QcmQuestion[];
  } | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [lexiqueAnswers, setLexiqueAnswers] = useState<Record<string, string>>({});
  const [oralAnswers, setOralAnswers] = useState<Record<string, string>>({});
  const [selectedSituations, setSelectedSituations] = useState<number[]>([]);
  const [recordingCursor, setRecordingCursor] = useState(0);

  useEffect(() => {
    apiGet<{ lexique: QcmQuestion[]; oral: QcmQuestion[] }>("/evaluation/questions")
      .then(setQuestions)
      .catch(() => setError("Impossible de charger les épreuves."));
    apiGet<Situation[]>("/evaluation/situations")
      .then(setSituations)
      .catch(() => setError("Impossible de charger les situations."));
  }, []);

  async function handleCoordonneesSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<{ candidatId: string; attemptId: string }>(
        "/evaluation/candidats",
        coordonnees
      );
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
        await finalizeSubmission();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Échec de l'envoi de l'enregistrement."
      );
    }
  }

  async function finalizeSubmission() {
    if (!attemptId) return;
    setStep("submitting");
    try {
      await apiPost(`/evaluation/attempts/${attemptId}/submit`, {
        lexiqueAnswers,
        oralAnswers,
      });
      setStep("confirmation");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue à la soumission."
      );
      setStep("record-situations");
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
          Ce test couvre pour l&apos;instant les Blocs 1, 3 et 4 (60 points).{" "}
          <strong className="text-white">
            Toutes les épreuves présentées sont obligatoires.
          </strong>
        </p>
        <p className="mt-3 font-sans text-sm text-white/70">
          Le résultat ne vous sera pas communiqué immédiatement — vous serez
          recontacté(e) par e-mail une fois l&apos;évaluation traitée.
        </p>
        <div className="mt-6 text-center">
          <Button variant="dark" onClick={() => setStep("lexique")}>
            Commencer le test
          </Button>
        </div>
      </div>
    );
  }

  if (!questions) {
    return <p className="text-center text-white/60">Chargement des épreuves...</p>;
  }

  if (step === "lexique") {
    return (
      <div className="mx-auto max-w-lg">
        <QcmBlock
          key="lexique"
          title="Bloc 1 — Lexique, Grammaire & Compréhension Écrite"
          questions={questions.lexique}
          answers={lexiqueAnswers}
          onChange={(id, v) => setLexiqueAnswers((a) => ({ ...a, [id]: v }))}
          onNext={() => setStep("oral")}
          nextLabel="Épreuve suivante"
        />
      </div>
    );
  }

  if (step === "oral") {
    return (
      <div className="mx-auto max-w-lg">
        <QcmBlock
          key="oral"
          title="Bloc 4 — Compréhension Orale (Podcasts B2 & C1)"
          questions={questions.oral}
          answers={oralAnswers}
          onChange={(id, v) => setOralAnswers((a) => ({ ...a, [id]: v }))}
          onNext={() => setStep("select-situations")}
          nextLabel="Épreuve suivante"
        />
      </div>
    );
  }

  if (step === "select-situations") {
    return (
      <div className="mx-auto max-w-2xl rounded border border-white/10 bg-obsidianCard p-6">
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
          <AudioRecorder onRecorded={handleRecorded} />
        </div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>
    );
  }

  if (step === "submitting") {
    return <p className="text-center text-white/60">Envoi de vos réponses...</p>;
  }

  return (
    <Reveal>
      <div className="mx-auto max-w-lg rounded border border-accent/40 bg-obsidianCard p-6 text-center">
        <h2 className="font-display text-xl font-semibold text-white">
          Merci, {coordonnees.firstName} !
        </h2>
        <p className="mt-3 font-sans text-sm text-white/70">
          Votre test a bien été enregistré. Le résultat ne vous sera pas
          communiqué immédiatement — vous recevrez un e-mail dès que
          l&apos;évaluation aura été traitée par notre équipe.
        </p>
      </div>
    </Reveal>
  );
}
