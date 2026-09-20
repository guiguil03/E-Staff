"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface TestEnAttente {
  attemptId: string;
  candidatNom: string;
  totalScore: number | null;
  gradedAt: string | null;
}

interface GroupeSansFormateur {
  groupeId: string;
  label: string;
  typeCours: string | null;
  nbApprenants: number;
}

interface FormateurDisponible {
  id: string;
  nom: string;
  typeCoursActuel: string | null;
}

interface ReunionAVenir {
  id: string;
  titre: string;
  startAt: string;
}

interface AlertesAdministratives {
  testsEnAttenteValidation: TestEnAttente[];
  groupesSansFormateur: GroupeSansFormateur[];
  formateursDisponibles: FormateurDisponible[];
  reunionsAVenir: ReunionAVenir[];
}

interface ForumLive {
  id: string;
  titre: string;
  invite: string;
  startAt: string | null;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

// Administratif & Alerte — la seule source d'alertes est l'état réel des
// données (test corrigé en attente de validation, groupe sans formateur,
// prochain Live Forum, réunions à venir) : rien n'est stocké comme
// "notification", chaque item disparaît de lui-même une fois la situation
// résolue. Le bouton "×" masque une carte pour la session en cours
// seulement (pas de persistance — sinon un vrai signal encore en attente
// resterait caché indéfiniment). Voir RhService.getAlertesAdministratives.
export default function AlerteAdministrativePanel() {
  const [data, setData] = useState<AlertesAdministratives | "loading" | "erreur">("loading");
  const [live, setLive] = useState<ForumLive | null | "loading">("loading");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [assignFormateurId, setAssignFormateurId] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<Record<string, string>>({});

  function refresh() {
    apiGet<AlertesAdministratives>("/rh/alertes-administratives", adminHeaders())
      .then(setData)
      .catch(() => setData("erreur"));
    apiGet<ForumLive | null>("/forum/live/prochain", adminHeaders())
      .then(setLive)
      .catch(() => setLive(null));
  }

  useEffect(refresh, []);

  function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key));
  }

  async function assigner(groupeId: string) {
    const formateurId = assignFormateurId[groupeId];
    if (!formateurId) return;
    setAssigning(groupeId);
    setAssignError((prev) => ({ ...prev, [groupeId]: "" }));
    try {
      await apiPut(`/rh/groupes/${groupeId}/formateur`, { formateurId }, adminHeaders());
      refresh();
    } catch (err) {
      setAssignError((prev) => ({
        ...prev,
        [groupeId]: err instanceof ApiError ? err.message : "Erreur — réessayez.",
      }));
    } finally {
      setAssigning(null);
    }
  }

  if (data === "loading" || live === "loading")
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (data === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  const cards: { key: string; node: React.ReactNode }[] = [];

  if (data.testsEnAttenteValidation.length > 0) {
    const t = data.testsEnAttenteValidation[0];
    cards.push({
      key: "tests",
      node: (
        <AlertCard tone="warning" onDismiss={() => dismiss("tests")}>
          <Link href={`/compte/admin/cycle/${t.attemptId}`} className="hover:underline">
            {data.testsEnAttenteValidation.length} test{data.testsEnAttenteValidation.length > 1 ? "s" : ""}{" "}
            corrigé{data.testsEnAttenteValidation.length > 1 ? "s" : ""} en attente de validation RH
          </Link>
          <span className="block font-mono text-[11px] text-white/40">
            Le plus ancien : {t.candidatNom} — {fmtDate(t.gradedAt)}
          </span>
        </AlertCard>
      ),
    });
  }

  for (const g of data.groupesSansFormateur) {
    cards.push({
      key: `groupe-${g.groupeId}`,
      node: (
        <AlertCard tone="warning" onDismiss={() => dismiss(`groupe-${g.groupeId}`)}>
          <span>
            Attribution : {g.nbApprenants} élève{g.nbApprenants > 1 ? "s" : ""}
            {g.typeCours ? ` (${g.typeCours})` : ""} du groupe <strong>{g.label}</strong> en attente
            d&apos;affectation formateur
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={assignFormateurId[g.groupeId] ?? ""}
              onChange={(e) =>
                setAssignFormateurId((prev) => ({ ...prev, [g.groupeId]: e.target.value }))
              }
              className="rounded border border-white/20 bg-obsidian px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
            >
              <option value="">— Choisir un formateur —</option>
              {data.formateursDisponibles
                .filter((f) => !g.typeCours || !f.typeCoursActuel || f.typeCoursActuel === g.typeCours)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                    {f.typeCoursActuel ? ` (${f.typeCoursActuel})` : ""}
                  </option>
                ))}
            </select>
            <button
              onClick={() => assigner(g.groupeId)}
              disabled={!assignFormateurId[g.groupeId] || assigning === g.groupeId}
              className="rounded border border-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {assigning === g.groupeId ? "..." : "Attribuer"}
            </button>
          </div>
          {assignError[g.groupeId] && (
            <p className="mt-2 font-mono text-[11px] text-accent">{assignError[g.groupeId]}</p>
          )}
        </AlertCard>
      ),
    });
  }

  cards.push({
    key: "forum",
    node: (
      <AlertCard tone="info" onDismiss={() => dismiss("forum")}>
        {live ? (
          <span>
            Prochain Live Forum : <strong>{live.titre}</strong> avec {live.invite} —{" "}
            {fmtDate(live.startAt)}
          </span>
        ) : (
          <span>Aucun Live Forum programmé.</span>
        )}
        <Link
          href="/compte/admin/parametres"
          className="mt-1 block font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
        >
          Gérer le Forum →
        </Link>
      </AlertCard>
    ),
  });

  cards.push({
    key: "reunions",
    node: (
      <AlertCard tone="info" onDismiss={() => dismiss("reunions")}>
        {data.reunionsAVenir.length > 0 ? (
          <span>
            {data.reunionsAVenir.length} réunion{data.reunionsAVenir.length > 1 ? "s" : ""} à
            venir — prochaine : <strong>{data.reunionsAVenir[0].titre}</strong> le{" "}
            {fmtDate(data.reunionsAVenir[0].startAt)}
          </span>
        ) : (
          <span>Aucune réunion programmée.</span>
        )}
        <Link
          href="/compte/admin/reunions"
          className="mt-1 block font-mono text-[11px] uppercase tracking-widest text-accent hover:underline"
        >
          Gérer les réunions →
        </Link>
      </AlertCard>
    ),
  });

  const visible = cards.filter((c) => !dismissed.has(c.key));

  return (
    <div className="rounded border border-white/10 bg-obsidianCard p-6">
      <h3 className="font-display text-base font-semibold text-white">Administratif &amp; Alerte</h3>
      <div className="mt-4 space-y-2">
        {visible.length === 0 && (
          <p className="font-sans text-xs text-white/50">Rien à signaler pour l&apos;instant.</p>
        )}
        {visible.map((c) => (
          <div key={c.key}>{c.node}</div>
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  tone,
  onDismiss,
  children,
}: {
  tone: "warning" | "info";
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded border px-3 py-2.5 pr-8 font-sans text-xs ${
        tone === "warning"
          ? "border-accent/30 bg-accent/5 text-white/80"
          : "border-white/10 bg-white/5 text-white/70"
      }`}
    >
      {children}
      <button
        onClick={onDismiss}
        aria-label="Masquer"
        className="absolute right-2 top-2 font-mono text-white/30 hover:text-white/60"
      >
        ×
      </button>
    </div>
  );
}
