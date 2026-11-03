"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { entrepriseMatricule, fmtDateHeure } from "./entrepriseApi";

interface Interet {
  id: string;
  statut: string;
  profil: { nom: string; matricule: string } | null;
}

interface Entretien {
  id: string;
  titre: string;
  startAt: string | null;
  dureeMinutes: number;
  createdAt: string;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const INPUT =
  "w-full rounded border border-white/15 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none disabled:opacity-40";
const BTN = "rounded bg-accent px-4 py-2 font-sans text-sm font-semibold text-obsidian disabled:opacity-40";
const messageErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");

// Salle d'entretien virtuel — l'entreprise planifie un entretien avec un
// profil du vivier (ou un candidat hors vivier, e-mail saisi à la main) ;
// le lien de la salle Daily est envoyé par e-mail au candidat, qui n'a pas
// de compte à ce stade du pipeline.
export default function SalleEntretien() {
  const [interets, setInterets] = useState<Interet[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[] | "loading" | "erreur">("loading");
  const [titre, setTitre] = useState("");
  const [interetId, setInteretId] = useState("");
  const [emailCandidat, setEmailCandidat] = useState("");
  const [startAt, setStartAt] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState("30");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const matricule = entrepriseMatricule();

  const charger = useCallback(() => {
    if (!matricule) {
      setEntretiens("erreur");
      return;
    }
    apiGet<Entretien[]>(`/entreprises-comptes/${matricule}/entretiens`).then(setEntretiens).catch(() => setEntretiens("erreur"));
    apiGet<Interet[]>(`/entreprises-comptes/${matricule}/vivier/interets`)
      .then((i) => setInterets(i.filter((x) => x.statut === "affecte" || x.statut === "propose")))
      .catch(() => {});
  }, [matricule]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function planifier() {
    setErreur(null);
    setSucces(null);
    setBusy(true);
    try {
      const r = await apiPost<{ configured: boolean; emailEnvoye: boolean }>(`/entreprises-comptes/${matricule}/entretiens`, {
        titre,
        interetVivierId: interetId || undefined,
        emailCandidat: interetId ? undefined : emailCandidat || undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        dureeMinutes: Number(dureeMinutes),
      });
      setSucces(
        r.emailEnvoye
          ? "Entretien planifié — le lien a été envoyé par e-mail au candidat."
          : r.configured
            ? "Entretien créé — l'e-mail n'a pas pu être envoyé, contactez le candidat directement."
            : "Entretien créé — la salle virtuelle n'est pas encore activée sur la plateforme."
      );
      setTitre("");
      setInteretId("");
      setEmailCandidat("");
      setStartAt("");
      charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded border border-statusRed/40 bg-statusRed/10 px-3 py-2 font-sans text-sm text-statusRed">{erreur}</p>
      )}
      {succes && (
        <p className="rounded border border-statusGreen/40 bg-statusGreen/10 px-3 py-2 font-sans text-sm text-statusGreen">{succes}</p>
      )}

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Planifier un entretien</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="ent-titre">Titre</label>
            <input id="ent-titre" maxLength={160} className={`mt-1 ${INPUT}`} value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="ent-profil">Profil du vivier (optionnel)</label>
            <select id="ent-profil" className={`mt-1 ${INPUT}`} value={interetId} onChange={(e) => setInteretId(e.target.value)}>
              <option value="">— Candidat hors vivier —</option>
              {interets.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.profil ? i.profil.nom : `Demande ${i.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>
          {!interetId && (
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="ent-email">E-mail du candidat</label>
              <input
                id="ent-email"
                type="email"
                className={`mt-1 ${INPUT}`}
                value={emailCandidat}
                onChange={(e) => setEmailCandidat(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className={LABEL} htmlFor="ent-debut">Date et heure</label>
            <input id="ent-debut" type="datetime-local" className={`mt-1 ${INPUT}`} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="ent-duree">Durée (min)</label>
            <input id="ent-duree" type="number" min={10} max={240} className={`mt-1 ${INPUT}`} value={dureeMinutes} onChange={(e) => setDureeMinutes(e.target.value)} />
          </div>
        </div>
        <button
          className={`mt-3 ${BTN}`}
          disabled={busy || !titre.trim() || (!interetId && !emailCandidat.trim())}
          onClick={planifier}
        >
          Planifier et envoyer l&apos;invitation
        </button>
      </div>

      <div className={CARD}>
        <h3 className="font-display text-lg font-semibold text-white">Entretiens planifiés</h3>
        {entretiens === "loading" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Chargement...</p>
        ) : entretiens === "erreur" ? (
          <p className="mt-3 font-sans text-sm text-white/50">Impossible de charger les entretiens.</p>
        ) : entretiens.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-white/50">Aucun entretien planifié.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5">
            {entretiens.map((e) => (
              <li key={e.id} className="py-2 font-sans text-sm text-white">
                {e.titre}
                <span className="block font-mono text-[11px] text-white/45">
                  {e.startAt ? fmtDateHeure(e.startAt) : "Date à définir"} · {e.dureeMinutes} min
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
