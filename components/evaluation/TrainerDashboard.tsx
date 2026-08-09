"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiGet, apiGetBlob, apiPostAuthed, ApiError } from "@/lib/api";

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

interface Attempt {
  id: string;
  status: string;
  lexiqueScore: number | null;
  oralScore: number | null;
  situationsScore: number | null;
  totalScore: number | null;
  tier: string | null;
  submittedAt: string | null;
  candidat: Candidat;
  situationResponses: SituationResponse[];
}

interface Situation {
  index: number;
  domain: string;
  context: string;
  mission: string;
}

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

const SESSION_KEY = "estaf-trainer-code";

export default function TrainerDashboard() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [criteria, setCriteria] = useState<GradingCriterion[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setCode(stored);
      tryAuth(stored);
    }
    apiGet<Situation[]>("/evaluation/situations").then(setSituations).catch(() => {});
  }, []);

  async function tryAuth(candidateCode: string) {
    setAuthError(null);
    try {
      const list = await apiGet<Attempt[]>("/evaluation/attempts", {
        "x-trainer-code": candidateCode,
      });
      setAttempts(list);
      const grading = await apiGet<GradingCriterion[]>("/evaluation/grading-criteria", {
        "x-trainer-code": candidateCode,
      });
      setCriteria(grading);
      setAuthed(true);
      sessionStorage.setItem(SESSION_KEY, candidateCode);
    } catch (err) {
      setAuthError(
        err instanceof ApiError && err.status === 401
          ? "Code formateur invalide."
          : "Impossible de charger les tentatives."
      );
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async function refreshList() {
    try {
      const list = await apiGet<Attempt[]>("/evaluation/attempts", {
        "x-trainer-code": code,
      });
      setAttempts(list);
    } catch {
      setListError("Impossible de rafraîchir la liste.");
    }
  }

  if (!authed) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tryAuth(code);
        }}
        className="mx-auto max-w-sm rounded border border-white/10 bg-obsidianCard p-6"
      >
        <h2 className="font-display text-lg font-semibold text-white">
          Accès formateur
        </h2>
        <p className="mt-2 font-sans text-xs text-white/50">
          Accès temporaire par code partagé, en attendant le système de
          comptes.
        </p>
        <input
          type="password"
          required
          placeholder="Code formateur"
          className="mt-4 w-full rounded border border-white/20 bg-obsidian px-4 py-2 text-sm text-white outline-none focus:border-accent"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {authError && <p className="mt-3 text-sm text-accent">{authError}</p>}
        <div className="mt-4">
          <Button type="submit" variant="dark">
            Entrer
          </Button>
        </div>
      </form>
    );
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
            const graded = a.situationResponses.filter((r) => r.gradedAt).length;
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
                    {a.status} — {graded}/{a.situationResponses.length} notées
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
            criteria={criteria}
            code={code}
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

function AttemptDetail({
  attempt,
  situations,
  criteria,
  code,
  onGraded,
}: {
  attempt: Attempt;
  situations: Situation[];
  criteria: GradingCriterion[];
  code: string;
  onGraded: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded border border-white/10 bg-obsidianCard p-4">
        <p className="font-display text-lg font-semibold text-white">
          {attempt.candidat.firstName} {attempt.candidat.lastName}
        </p>
        <p className="text-xs text-white/50">{attempt.candidat.email}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-white/80">
          <p>Lexique : {attempt.lexiqueScore ?? "—"}/20</p>
          <p>Oral : {attempt.oralScore ?? "—"}/20</p>
          <p>Situations : {attempt.situationsScore ?? "—"}/20</p>
        </div>
        {attempt.totalScore !== null && (
          <p className="mt-2 text-sm text-accent">
            Total : {attempt.totalScore}/100 — {attempt.tier}
          </p>
        )}
      </div>

      {attempt.situationResponses
        .slice()
        .sort((a, b) => a.situationIndex - b.situationIndex)
        .map((response) => (
          <SituationGrader
            key={response.id}
            response={response}
            situation={situations.find((s) => s.index === response.situationIndex)}
            criteria={criteria}
            code={code}
            onGraded={onGraded}
          />
        ))}
    </div>
  );
}

function SituationGrader({
  response,
  situation,
  criteria,
  code,
  onGraded,
}: {
  response: SituationResponse;
  situation: Situation | undefined;
  criteria: GradingCriterion[];
  code: string;
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
    apiGetBlob(`/evaluation/situation-responses/${response.id}/audio`, {
      "x-trainer-code": code,
    })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
      })
      .catch(() => setError("Audio indisponible."));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [response.id, code]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiPostAuthed(
        `/evaluation/situation-responses/${response.id}/grade`,
        { criteria: levels },
        { "x-trainer-code": code }
      );
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
