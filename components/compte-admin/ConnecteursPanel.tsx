"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import type { ConnecteurStatus } from "@/lib/types";
import { adminHeaders } from "./adminHeaders";

interface Connecteur {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  activityType: string;
  clientCount: string;
  soughtRoles: string; // JSON-encoded array
  cvVolume: string;
  budgetPerAgent: string;
  presentationMode: string;
  paymentChannel: string;
  opportunityTiming: string;
  status: ConnecteurStatus;
  createdAt: string;
}

const STATUTS: { value: ConnecteurStatus; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "contacte", label: "Contacté" },
  { value: "actif", label: "Actif" },
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

function roles(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
  } catch {
    return json;
  }
}

// Portail RH — demandes de partenariat déposées via le parcours public
// « Devenir Connecteur » (table Connecteur).
export default function ConnecteursPanel() {
  const [items, setItems] = useState<Connecteur[] | "loading" | "erreur">("loading");
  const [filtre, setFiltre] = useState<ConnecteurStatus | "tous">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Connecteur[]>("/rh/connecteurs", adminHeaders())
      .then(setItems)
      .catch((err) => {
        setItems("erreur");
        setErreur(messageErreur(err));
      });
  }, []);

  async function changerStatut(id: string, status: ConnecteurStatus) {
    setErreur(null);
    try {
      await apiPut(`/rh/connecteurs/${id}/status`, { status }, adminHeaders());
      setItems((cur) =>
        Array.isArray(cur) ? cur.map((c) => (c.id === id ? { ...c, status } : c)) : cur
      );
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  if (items === "loading") return <p className="text-sm text-white/50">Chargement...</p>;
  if (items === "erreur") return <p className="text-sm text-accent">{erreur}</p>;

  const visibles = filtre === "tous" ? items : items.filter((c) => c.status === filtre);
  const compte = (s: ConnecteurStatus) => items.filter((c) => c.status === s).length;
  const filtres: { value: ConnecteurStatus | "tous"; label: string }[] = [
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
        <p className="text-sm text-white/50">Aucun connecteur pour ce filtre.</p>
      )}

      {visibles.map((c) => {
        const isOpen = ouvert === c.id;
        const nom = `${c.firstName} ${c.lastName}`;
        return (
          <div key={c.id} className="rounded border border-white/10 bg-obsidianCard p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOuvert(isOpen ? null : c.id)}
                className="min-w-0 text-left"
              >
                <p className="font-display text-base text-white">{nom}</p>
                <p className="font-sans text-xs text-white/50">
                  {c.activityType} · reçu le {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </button>
              <select
                aria-label={`Statut de ${nom}`}
                value={c.status}
                onChange={(e) => changerStatut(c.id, e.target.value as ConnecteurStatus)}
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
                <Info label="E-mail" value={c.email} href={`mailto:${c.email}`} />
                <Info label="Téléphone" value={c.phone} href={`tel:${c.phone}`} />
                <Info label="Nombre de clients" value={c.clientCount} />
                <Info label="Profils recherchés" value={roles(c.soughtRoles)} />
                <Info label="Volume de CV" value={c.cvVolume} />
                <Info label="Budget / agent" value={c.budgetPerAgent} />
                <Info label="Mode de présentation" value={c.presentationMode} />
                <Info label="Paiement" value={c.paymentChannel} />
                <Info label="Opportunité" value={c.opportunityTiming} />
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
