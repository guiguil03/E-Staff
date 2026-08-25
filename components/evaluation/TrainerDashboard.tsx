"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiGet, apiGetBlob, apiPost } from "@/lib/api";

interface Candidat {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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

interface Attempt {
  id: string;
  status: string;
  lexiqueScore: number | null;
  oralScore: number | null;
  situationsScore: number | null;
  videoScore: number | null;
  essayScore: number | null;
  totalScore: number | null;
  tier: string | null;
  submittedAt: string | null;
  candidat: Candidat;
  situationResponses: SituationResponse[];
  videoResponses: VideoResponse[];
  essayResponse: EssayResponse | null;
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

// Échelons du barème Bloc 2 (voir backend/src/evaluation/commentaire-argumentatif.ts).
const ESSAY_GRADING_LEVELS = [
  { key: "1.25", value: 1.25, label: "Insuffisant" },
  { key: "2.5", value: 2.5, label: "Passable" },
  { key: "3.75", value: 3.75, label: "Bon" },
  { key: "5", value: 5, label: "Excellent" },
] as const;

// Code formateur (x-trainer-code) retiré le 2026-08-25 à la demande du
// client — trop de friction pour l'usage actuel (voir TrainerGuard côté
// backend, toujours défini mais plus branché sur ces routes). La page reste
// hors nav, accessible par URL directe uniquement.
export default function TrainerDashboard() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [essaySubjects, setEssaySubjects] = useState<EssaySubject[]>([]);
  const [criteria, setCriteria] = useState<GradingCriterion[]>([]);
  const [videoCriteria, setVideoCriteria] = useState<GradingCriterion[]>([]);
  const [essayCriteria, setEssayCriteria] = useState<GradingCriterion[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    refreshList();
    apiGet<Situation[]>("/evaluation/situations").then(setSituations).catch(() => {});
    apiGet<VideoTask[]>("/evaluation/video-tasks").then(setVideoTasks).catch(() => {});
    apiGet<EssaySubject[]>("/evaluation/essay-subjects").then(setEssaySubjects).catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/grading-criteria").then(setCriteria).catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/video-grading-criteria")
      .then(setVideoCriteria)
      .catch(() => {});
    apiGet<GradingCriterion[]>("/evaluation/essay-grading-criteria")
      .then(setEssayCriteria)
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

  const selected = attempts.find((a) => a.id === selectedId) ?? null;

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
            const graded = gradedSituations + gradedVideos + gradedEssay;
            const total =
              a.situationResponses.length + a.videoResponses.length + (a.essayResponse ? 1 : 0);
            return (
              <li key={a.id}>
                <button
                  onClick={() => setSelectedId(a.id)}
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
                    {a.status} — {graded}/{total} notées
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
            criteria={criteria}
            videoCriteria={videoCriteria}
            essayCriteria={essayCriteria}
            onGraded={refreshList}
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
  | { type: "situation"; response: SituationResponse }
  | { type: "video"; response: VideoResponse }
  | { type: "essay"; response: EssayResponse };

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
  criteria,
  videoCriteria,
  essayCriteria,
  onGraded,
}: {
  attempt: Attempt;
  situations: Situation[];
  videoTasks: VideoTask[];
  essaySubjects: EssaySubject[];
  criteria: GradingCriterion[];
  videoCriteria: GradingCriterion[];
  essayCriteria: GradingCriterion[];
  onGraded: () => void;
}) {
  const items: CarouselItem[] = [
    ...attempt.situationResponses
      .slice()
      .sort((a, b) => a.situationIndex - b.situationIndex)
      .map((response) => ({ type: "situation" as const, response })),
    ...attempt.videoResponses
      .slice()
      .sort((a, b) => a.taskIndex - b.taskIndex)
      .map((response) => ({ type: "video" as const, response })),
    ...(attempt.essayResponse ? [{ type: "essay" as const, response: attempt.essayResponse }] : []),
  ];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [attempt.id]);

  const current = index < items.length ? items[index] : null;
  const gradedCount = items.filter((i) => i.response.gradedAt).length;

  function handleGraded() {
    onGraded();
    setIndex((i) => Math.min(i + 1, items.length - 1));
  }

  return (
    <div className="space-y-4">
      <div className="rounded border border-white/10 bg-obsidianCard p-4">
        <p className="font-display text-lg font-semibold text-white">
          {attempt.candidat.firstName} {attempt.candidat.lastName}
        </p>
        <p className="text-xs text-white/50">{attempt.candidat.email}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-5">
          <p>Lexique : {attempt.lexiqueScore ?? "—"}/20</p>
          <p>Essai : {attempt.essayScore ?? "—"}/20</p>
          <p>Situations : {attempt.situationsScore ?? "—"}/20</p>
          <p>Oral : {attempt.oralScore ?? "—"}/20</p>
          <p>Vidéo : {attempt.videoScore ?? "—"}/20</p>
        </div>
        {attempt.totalScore !== null && (
          <p className="mt-2 text-sm text-accent">
            Total : {attempt.totalScore}/100 — {attempt.tier}
          </p>
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
                      : "E";
                const graded = Boolean(item.response.gradedAt);
                return (
                  <button
                    key={item.response.id}
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

          {current.type === "situation" ? (
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
          ) : (
            <EssayGrader
              key={current.response.id}
              response={current.response}
              subject={essaySubjects.find((s) => s.key === current.response.subjectKey)}
              criteria={essayCriteria}
              onGraded={handleGraded}
            />
          )}
        </>
      )}
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
