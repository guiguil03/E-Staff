"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import type { EntrepriseProjetStatus } from "@/lib/types";
import { adminHeaders } from "./adminHeaders";

interface ProjetClient {
  id: string;
  companyName: string;
  taxId: string;
  sector: string;
  address: string;
  country: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  serviceType: string;
  teamSize: string;
  startDate: string;
  needsDetails: string;
  status: EntrepriseProjetStatus;
  createdAt: string;
}

const STATUTS: { value: EntrepriseProjetStatus; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "contacte", label: "Contacté" },
  { value: "qualifie", label: "Qualifié" },
  { value: "converti", label: "Converti" },
];

function messageErreur(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return "Session RH invalide ou expirée — reconnectez-vous avec un compte RH.";
    }
    return err.message;
  }
  return "Opération impossible — réessayez.";
}

// Portail RH — demandes d'externalisation déposées par les entreprises via
// le formulaire public « Proposer un projet » (table EntrepriseProjet).
export default function ProjetsClientsPanel() {
  const [items, setItems] = useState<ProjetClient[] | "loading" | "erreur">("loading");
  const [filtre, setFiltre] = useState<EntrepriseProjetStatus | "tous">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiGet<ProjetClient[]>("/rh/entreprises-projets", adminHeaders())
      .then(setItems)
      .catch((err) => {
        setItems("erreur");
        setErreur(messageErreur(err));
      });
  }, []);

  async function changerStatut(id: string, status: EntrepriseProjetStatus) {
    setErreur(null);
    try {
      await apiPut(`/rh/entreprises-projets/${id}/status`, { status }, adminHeaders());
      setItems((cur) =>
        Array.isArray(cur) ? cur.map((p) => (p.id === id ? { ...p, status } : p)) : cur
      );
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  if (items === "loading") return <p className="text-sm text-white/50">Chargement...</p>;
  if (items === "erreur") return <p className="text-sm text-accent">{erreur}</p>;

  const visibles = filtre === "tous" ? items : items.filter((p) => p.status === filtre);
  const compte = (s: EntrepriseProjetStatus) => items.filter((p) => p.status === s).length;
  const filtres: { value: EntrepriseProjetStatus | "tous"; label: string }[] = [
    { value: "tous", label: `Tous (${items.length})` },
    ...STATUTS.map((s) => ({ value: s.value, label: `${s.label} (${compte(s.value)})` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filtres.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltre(f.value)}
            className={`rounded border px-3 py-1.5 font-sans text-xs transition-colors ${
              filtre === f.value
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-white/15 text-white/60 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm text-accent">{erreur}</p>}
      {visibles.length === 0 && (
        <p className="text-sm text-white/50">Aucune demande pour ce filtre.</p>
      )}

      {visibles.map((p) => {
        const isOpen = ouvert === p.id;
        return (
          <div key={p.id} className="rounded border border-white/10 bg-obsidianCard p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOuvert(isOpen ? null : p.id)}
                className="min-w-0 text-left"
              >
                <p className="font-display text-base text-white">{p.companyName}</p>
                <p className="font-sans text-xs text-white/50">
                  {p.serviceType} · {p.teamSize} · reçu le{" "}
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </button>
              <select
                aria-label={`Statut de ${p.companyName}`}
                value={p.status}
                onChange={(e) => changerStatut(p.id, e.target.value as EntrepriseProjetStatus)}
                className="rounded border border-white/20 bg-obsidian px-3 py-1.5 font-sans text-sm text-white outline-none focus:border-accent"
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {isOpen && (
              <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-white/10 pt-4 font-sans text-sm sm:grid-cols-2">
                <Info label="Contact" value={`${p.contactName} (${p.contactRole})`} />
                <Info label="E-mail" value={p.email} href={`mailto:${p.email}`} />
                <Info label="Téléphone" value={p.phone} href={`tel:${p.phone}`} />
                <Info label="Identifiant fiscal" value={p.taxId} />
                <Info label="Secteur" value={p.sector} />
                <Info label="Adresse" value={`${p.address}, ${p.country}`} />
                <Info label="Démarrage souhaité" value={p.startDate} />
                <div className="sm:col-span-2">
                  <Info label="Besoins & attentes" value={p.needsDetails} />
                </div>
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-white/40">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-white/80">
        {href ? (
          <a href={href} className="text-accent underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
