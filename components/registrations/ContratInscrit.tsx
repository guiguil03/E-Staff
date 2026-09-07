"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiGet, apiPost, ApiError } from "@/lib/api";

interface ContractInfo {
  status: string;
  prenom: string;
  programme: string;
  duree: string | null;
  frais: string | null;
  conditions: string | null;
  paymentReference: string | null;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

// Page accessible uniquement via le lien envoyé par e-mail à l'inscrit
// (id d'inscription comme jeton, pas de compte à créer) — même principe
// que components/evaluation/ContratCandidat.tsx côté recrutement.
export default function ContratInscrit({ registrationId }: { registrationId: string }) {
  const [info, setInfo] = useState<ContractInfo | "loading" | "erreur">("loading");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setInfo("loading");
    apiGet<ContractInfo>(`/registrations/contrats/${registrationId}`)
      .then(setInfo)
      .catch(() => setInfo("erreur"));
  }

  useEffect(refresh, [registrationId]);

  async function submitReference(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;
    setStatus("sending");
    setError(null);
    try {
      await apiPost(`/registrations/contrats/${registrationId}/paiement`, { reference });
      setStatus("idle");
      refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    }
  }

  if (info === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  }
  if (info === "erreur") {
    return (
      <p className="font-sans text-sm text-white/50">
        Ce lien n&apos;est plus valide ou votre contrat n&apos;est pas encore disponible.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-sans text-sm text-white/80">
          Bonjour <span className="text-white">{info.prenom}</span>, voici les termes de votre
          formation : <span className="text-accent">{info.programme}</span>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="font-sans text-sm text-white/70">
            <span className="text-white/50">Durée :</span> {info.duree}
          </p>
          <p className="font-sans text-sm text-white/70">
            <span className="text-white/50">Frais :</span> {info.frais}
          </p>
        </div>
        <p className="mt-3 font-sans text-sm text-white/70">{info.conditions}</p>

        <div className="mt-5">
          <Button
            variant="ghostDark"
            href={`${API_URL}/registrations/contrats/${registrationId}/pdf`}
          >
            Télécharger le contrat (PDF)
          </Button>
        </div>
      </div>

      {info.status === "converti" && (
        <div className="rounded border border-accent/40 bg-obsidianCard p-6 text-center">
          <p className="font-display text-lg text-white">Bienvenue chez e-Staf !</p>
          <p className="mt-3 font-sans text-sm text-white/70">
            Votre paiement a été confirmé — votre inscription est activée. Vous serez recontacté(e)
            pour la suite.
          </p>
        </div>
      )}

      {info.status === "en_attente_paiement" && (
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-sans text-sm text-white/80">
            Référence transmise : <span className="text-white">{info.paymentReference}</span>
          </p>
          <p className="mt-2 font-sans text-sm text-white/60">
            Un membre de l&apos;équipe e-Staf vérifie votre paiement et confirmera votre
            inscription très prochainement.
          </p>
        </div>
      )}

      {info.status === "contrat_envoye" && (
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Étape suivante : le paiement
          </h3>
          <p className="mt-2 font-sans text-sm text-white/60">
            Effectuez le paiement par Mobile Money ou virement selon les instructions transmises
            par l&apos;équipe e-Staf, puis indiquez ici la référence de la transaction.
          </p>
          <form onSubmit={submitReference} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Référence de la transaction"
              required
              className="flex-1 rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
            <Button type="submit" variant="dark" disabled={status === "sending" || !reference.trim()}>
              {status === "sending" ? "Envoi..." : "Envoyer ma référence"}
            </Button>
          </form>
          {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-accent hover:underline">
          ← Retour à l&apos;accueil e-Staf
        </Link>
      </p>
    </div>
  );
}
