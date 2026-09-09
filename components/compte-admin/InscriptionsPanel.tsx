"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiGet, apiPostAuthed, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

interface RegistrationApi {
  id: string;
  segment: string;
  firstName: string;
  email: string;
  phone: string;
  typeFormation: string | null;
  status: string;
  contractSentAt: string | null;
  paymentReference: string | null;
  paymentReceiptKey: string | null;
  paymentMethod: string | null;
  paymentConfirmedAt: string | null;
  createdAt: string;
}

interface ContractDraft {
  duree: string;
  frais: string;
  conditions: string;
}

const EMPTY_DRAFT: ContractDraft = { duree: "", frais: "", conditions: "" };

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  contrat_envoye: "Contrat envoyé — en attente de référence",
  en_attente_paiement: "Référence reçue — à confirmer",
  converti: "Converti",
};

const STATUS_TONE: Record<string, string> = {
  nouveau: "text-white/60",
  contacte: "text-white/60",
  contrat_envoye: "text-accent",
  en_attente_paiement: "text-accent",
  converti: "text-success",
};

// Portail RH — inscriptions tous funnels confondus (Examens, FOL,
// Entreprises, Studio Métier). L'admin saisit les termes (durée, frais,
// conditions — pas de modèle figé) : un vrai e-mail part avec le PDF et un
// lien vers /inscription/contrat/[id], où l'inscrit consulte son contrat et
// transmet lui-même sa référence Mobile Money/virement. La saisie manuelle
// ici reste un repli si l'inscrit appelle plutôt que d'utiliser le lien —
// pas de webhook dans tous les cas, confirmation après vérification sur
// votre compte (même principe que PaiementsPanel côté recrutement).
export default function InscriptionsPanel() {
  const [registrations, setRegistrations] = useState<RegistrationApi[] | "loading" | "erreur">(
    "loading"
  );
  const [contractOpenId, setContractOpenId] = useState<string | null>(null);
  const [contractDrafts, setContractDrafts] = useState<Record<string, ContractDraft>>({});
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function refresh() {
    setRegistrations("loading");
    apiGet<RegistrationApi[]>("/registrations", adminHeaders())
      .then(setRegistrations)
      .catch(() => setRegistrations("erreur"));
  }

  useEffect(refresh, []);

  async function runAction(id: string, action: () => Promise<unknown>) {
    setPendingId(id);
    setErrorId(null);
    try {
      await action();
      refresh();
    } catch (err) {
      setErrorId(id);
      alert(err instanceof ApiError ? err.message : "Erreur — réessayer.");
    } finally {
      setPendingId(null);
    }
  }

  function openContractForm(id: string) {
    setContractOpenId(id);
    setContractDrafts((d) => ({ ...d, [id]: d[id] ?? EMPTY_DRAFT }));
  }

  function updateContractDraft(id: string, field: keyof ContractDraft, value: string) {
    setContractDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_DRAFT), [field]: value } }));
  }

  const sendContract = (id: string) => {
    const draft = contractDrafts[id] ?? EMPTY_DRAFT;
    if (!draft.duree.trim() || !draft.frais.trim() || !draft.conditions.trim()) return;
    return runAction(id, () =>
      apiPostAuthed(`/registrations/${id}/send-contract`, draft, adminHeaders())
    ).then(() => setContractOpenId(null));
  };

  const submitReference = (id: string) => {
    const reference = (referenceDrafts[id] ?? "").trim();
    if (!reference) return;
    return runAction(id, () =>
      apiPostAuthed(`/registrations/${id}/payment-reference`, { reference }, adminHeaders())
    );
  };

  const confirmPayment = (id: string) =>
    runAction(id, () => apiPostAuthed(`/registrations/${id}/confirm-payment`, {}, adminHeaders()));

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">Inscriptions</h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Tous funnels confondus — le contrat part par e-mail avec un lien où l&apos;inscrit
          consulte son contrat et transmet sa référence de paiement.
        </p>

        {registrations === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {registrations === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">Erreur de chargement.</p>
        )}
        {Array.isArray(registrations) && registrations.length === 0 && (
          <p className="mt-4 font-sans text-sm text-white/50">Aucune inscription pour le moment.</p>
        )}

        {Array.isArray(registrations) && registrations.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] font-sans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="py-2 pr-2 font-mono font-normal">Inscrit</th>
                  <th className="py-2 pr-2 font-mono font-normal">Programme</th>
                  <th className="py-2 pr-2 font-mono font-normal">Statut</th>
                  <th className="py-2 font-mono font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => {
                  const isPending = pendingId === r.id;
                  const draft = contractDrafts[r.id] ?? EMPTY_DRAFT;
                  const draftValid =
                    draft.duree.trim() && draft.frais.trim() && draft.conditions.trim();
                  return (
                    <tr key={r.id} className="border-b border-white/5 align-top">
                      <td className="py-2 pr-2 text-white">
                        {r.firstName}
                        <span className="block font-mono text-[10px] text-white/40">
                          {r.email} · {r.phone}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-white/70">
                        {r.typeFormation ?? r.segment}
                      </td>
                      <td className={`py-2 pr-2 font-mono text-xs ${STATUS_TONE[r.status] ?? "text-white/60"}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                        {r.status === "converti" && r.paymentMethod && (
                          <span className="block text-white/40">
                            {r.paymentMethod === "papi" ? "Payé en ligne (Papi)" : "Confirmé — virement"}
                          </span>
                        )}
                        {r.paymentReference && (
                          <span className="block text-white/40">Réf. : {r.paymentReference}</span>
                        )}
                        {r.paymentReceiptKey && (
                          <a
                            href={`${API_URL}/registrations/contrats/${r.id}/recu`}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-accent hover:underline"
                          >
                            Voir le reçu
                          </a>
                        )}
                        {errorId === r.id && (
                          <span className="block text-accent">Échec — réessayer.</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {r.status === "converti" ? (
                          <span className="font-mono text-xs text-white/30">—</span>
                        ) : !r.contractSentAt ? (
                          contractOpenId === r.id ? (
                            <div className="ml-auto flex w-64 flex-col gap-2 rounded border border-accent/30 bg-obsidian p-3">
                              <input
                                type="text"
                                placeholder="Durée (ex. 5 semaines)"
                                value={draft.duree}
                                onChange={(e) => updateContractDraft(r.id, "duree", e.target.value)}
                                className="rounded border border-white/20 bg-obsidianCard px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
                              />
                              <input
                                type="text"
                                placeholder="Frais (ex. 50 €)"
                                value={draft.frais}
                                onChange={(e) => updateContractDraft(r.id, "frais", e.target.value)}
                                className="rounded border border-white/20 bg-obsidianCard px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
                              />
                              <textarea
                                placeholder="Conditions"
                                value={draft.conditions}
                                onChange={(e) =>
                                  updateContractDraft(r.id, "conditions", e.target.value)
                                }
                                rows={2}
                                className="rounded border border-white/20 bg-obsidianCard px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghostDark" onClick={() => setContractOpenId(null)}>
                                  Annuler
                                </Button>
                                <Button
                                  variant="dark"
                                  disabled={isPending || !draftValid}
                                  onClick={() => sendContract(r.id)}
                                >
                                  {isPending ? "Envoi..." : "Envoyer"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghostDark"
                              disabled={isPending}
                              onClick={() => openContractForm(r.id)}
                            >
                              Envoyer le contrat
                            </Button>
                          )
                        ) : !r.paymentReference ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="text"
                              placeholder="Référence"
                              value={referenceDrafts[r.id] ?? ""}
                              onChange={(e) =>
                                setReferenceDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                              }
                              className="w-32 rounded border border-white/20 bg-obsidian px-2 py-1 font-sans text-xs text-white outline-none focus:border-accent"
                            />
                            <Button
                              variant="ghostDark"
                              disabled={isPending || !(referenceDrafts[r.id] ?? "").trim()}
                              onClick={() => submitReference(r.id)}
                            >
                              Enregistrer
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="dark"
                            disabled={isPending}
                            onClick={() => confirmPayment(r.id)}
                          >
                            {isPending ? "..." : "Paiement reçu"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Reveal>
  );
}
