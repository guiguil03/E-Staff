"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiGet, apiUpload, ApiError } from "@/lib/api";

interface ContractInfo {
  status: string;
  prenom: string;
  programme: string;
  duree: string | null;
  frais: string | null;
  conditions: string | null;
  paymentReference: string | null;
  hasReceipt: boolean;
  paymentInfo: {
    mobileMoneyMg: string | null;
    ribLocal: string | null;
    international: string | null;
  };
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

// Page accessible uniquement via le lien envoyé par e-mail à l'inscrit
// (id d'inscription comme jeton, pas de compte à créer) — même principe
// que components/evaluation/ContratCandidat.tsx côté recrutement.
export default function ContratInscrit({ registrationId }: { registrationId: string }) {
  const [info, setInfo] = useState<ContractInfo | "loading" | "erreur">("loading");
  const [reference, setReference] = useState("");
  const [recu, setRecu] = useState<File | null>(null);
  const [cguAccepted, setCguAccepted] = useState(false);
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
    if (!reference.trim() || !cguAccepted) return;
    setStatus("sending");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("reference", reference);
      formData.append("cguAccepted", "true");
      if (recu) formData.append("recu", recu);
      await apiUpload(`/registrations/contrats/${registrationId}/paiement`, formData);
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

  const { paymentInfo } = info;
  const hasPaymentInfo = paymentInfo.mobileMoneyMg || paymentInfo.ribLocal || paymentInfo.international;

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
          {info.hasReceipt && (
            <p className="mt-1 font-sans text-xs text-white/40">Reçu bien reçu.</p>
          )}
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

          {hasPaymentInfo && (
            <div className="mt-4 space-y-3 rounded border border-white/10 bg-obsidian p-4">
              {paymentInfo.mobileMoneyMg && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">
                    Mobile Money (Madagascar)
                  </p>
                  <p className="mt-1 whitespace-pre-line font-sans text-sm text-white/80">
                    {paymentInfo.mobileMoneyMg}
                  </p>
                </div>
              )}
              {paymentInfo.ribLocal && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">
                    Virement bancaire (Madagascar)
                  </p>
                  <p className="mt-1 whitespace-pre-line font-sans text-sm text-white/80">
                    {paymentInfo.ribLocal}
                  </p>
                </div>
              )}
              {paymentInfo.international && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">
                    Depuis l&apos;étranger
                  </p>
                  <p className="mt-1 whitespace-pre-line font-sans text-sm text-white/80">
                    {paymentInfo.international}
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="mt-4 font-sans text-sm text-white/60">
            Une fois le paiement effectué, indiquez ci-dessous la référence de la transaction
            (vous pouvez aussi joindre une capture d&apos;écran ou une photo du reçu).
          </p>
          <form onSubmit={submitReference} className="mt-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Référence de la transaction"
                required
                className="flex-1 rounded border border-white/20 bg-obsidian px-4 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              />
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setRecu(e.target.files?.[0] ?? null)}
                className="flex-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-xs text-white/70 file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:font-sans file:text-xs file:text-obsidian"
              />
            </div>

            <label className="flex items-start gap-2 font-sans text-xs text-white/60">
              <input
                type="checkbox"
                checked={cguAccepted}
                onChange={(e) => setCguAccepted(e.target.checked)}
                required
                className="mt-0.5"
              />
              <span>
                J&apos;accepte sans réserve les{" "}
                <Link href="/conditions-generales" target="_blank" className="text-accent hover:underline">
                  Conditions Générales d&apos;Utilisation et d&apos;Inscription
                </Link>
                .
              </span>
            </label>

            <Button
              type="submit"
              variant="dark"
              disabled={status === "sending" || !reference.trim() || !cguAccepted}
            >
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
