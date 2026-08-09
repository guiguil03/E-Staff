"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";

interface PendingPayment {
  id: string;
  candidat: { firstName: string; lastName: string; email: string };
  paymentReference: string | null;
}

interface GroupeAvecPlaces {
  id: string;
  cle: string;
  label: string;
  placesRestantes: number;
}

function adminHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-admin-matricule": matricule } : {};
}

// Écran RH — paiements Mobile Money / virement en attente de confirmation.
// Pas de webhook : le candidat transmet une référence, un admin vérifie sur
// son compte Mobile Money/bancaire puis clique "Paiement reçu" en
// choisissant le groupe — ça génère le matricule et crée le vrai Apprenant
// instantanément (voir brainstorm 2026-08-09).
interface PaiementsPanelProps {
  /** Prévient le parent qu'un statut a changé, pour rafraîchir la Vue
   * d'ensemble (autrement en cache jusqu'au prochain rechargement complet). */
  onChange?: () => void;
}

export default function PaiementsPanel({ onChange }: PaiementsPanelProps) {
  const [payments, setPayments] = useState<PendingPayment[] | "loading" | "erreur">("loading");
  const [groupes, setGroupes] = useState<GroupeAvecPlaces[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [groupeId, setGroupeId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  function refresh() {
    setPayments("loading");
    apiGet<PendingPayment[]>("/evaluation/pending-payment", adminHeaders())
      .then(setPayments)
      .catch(() => setPayments("erreur"));
    apiGet<GroupeAvecPlaces[]>("/evaluation/groupes-avec-places", adminHeaders())
      .then(setGroupes)
      .catch(() => setGroupes([]));
  }

  useEffect(refresh, []);

  function openPayment(id: string) {
    setOpenId(id);
    setGroupeId("");
    setStatus("idle");
  }

  async function confirm() {
    if (!openId || !groupeId) return;
    setStatus("saving");
    try {
      await apiPostAuthed(
        `/evaluation/attempts/${openId}/confirm-payment`,
        { groupeId },
        adminHeaders()
      );
      setOpenId(null);
      setStatus("idle");
      refresh();
      onChange?.();
    } catch {
      setStatus("error");
    }
  }

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Paiements en attente de confirmation
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Vérifiez la référence sur votre compte Mobile Money / bancaire avant de confirmer.
        </p>

        <div className="mt-4 space-y-2">
          {payments === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {payments === "erreur" && (
            <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>
          )}
          {Array.isArray(payments) && payments.length === 0 && (
            <p className="font-sans text-sm text-white/50">Aucun paiement en attente.</p>
          )}
          {Array.isArray(payments) &&
            payments.map((p) => (
              <div key={p.id}>
                <button
                  onClick={() => openPayment(p.id)}
                  className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
                    openId === p.id
                      ? "border-accent bg-obsidian"
                      : "border-white/10 bg-obsidian hover:border-accent/50"
                  }`}
                >
                  <span>
                    <span className="block font-sans text-sm text-white">
                      {p.candidat.firstName} {p.candidat.lastName}
                    </span>
                    <span className="block font-mono text-[11px] text-white/40">
                      Réf. paiement : {p.paymentReference ?? "—"}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-accent">
                    {openId === p.id ? "Ouvert" : "Confirmer"}
                  </span>
                </button>

                {openId === p.id && (
                  <div className="mt-2 rounded border border-accent/30 bg-obsidian p-4">
                    <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                      Groupe d&apos;affectation
                    </label>
                    <select
                      value={groupeId}
                      onChange={(e) => setGroupeId(e.target.value)}
                      className="mt-1 w-full rounded border border-white/20 bg-obsidianCard px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                    >
                      <option value="">— Choisir un groupe —</option>
                      {groupes.map((g) => (
                        <option key={g.id} value={g.id} disabled={g.placesRestantes <= 0}>
                          {g.label} ({g.placesRestantes} place{g.placesRestantes > 1 ? "s" : ""}{" "}
                          restante{g.placesRestantes > 1 ? "s" : ""})
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        variant="dark"
                        onClick={confirm}
                        disabled={status === "saving" || !groupeId}
                      >
                        {status === "saving" ? "Confirmation..." : "Paiement reçu"}
                      </Button>
                      <Button variant="ghostDark" onClick={() => setOpenId(null)}>
                        Annuler
                      </Button>
                    </div>
                    {status === "error" && (
                      <p className="mt-2 font-mono text-xs text-accent">Erreur — réessayer.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </Reveal>
  );
}
