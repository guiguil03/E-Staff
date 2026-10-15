"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { apiDelete, apiGet, apiPostAuthed, apiPut, ApiError } from "@/lib/api";
import { formatDateFr, type LotEntreprise, type MissionEntreprise } from "@/lib/offresEntreprises";
import { adminHeaders } from "./adminHeaders";

type Onglet = "lots" | "missions";
type LotRh = LotEntreprise & { publie: boolean };
type MissionRh = MissionEntreprise & { publie: boolean };
type ItemRh = LotRh | MissionRh;

interface LotForm {
  nom: string;
  mission: string;
  dateFinFormation: string; // yyyy-mm-dd
  statutLabel: string;
  segment: string;
  publie: boolean;
}

interface MissionForm {
  titre: string;
  sousTitre: string;
  description: string;
  disponible: boolean;
  detailStatut: string;
  ctaLabel: string;
  segment: string;
  publie: boolean;
}

const LOT_VIDE: LotForm = {
  nom: "",
  mission: "",
  dateFinFormation: "",
  statutLabel: "En attente de déploiement",
  segment: "",
  publie: true,
};

const MISSION_VIDE: MissionForm = {
  titre: "",
  sousTitre: "",
  description: "",
  disponible: true,
  detailStatut: "",
  ctaLabel: "Démarrer ce projet",
  segment: "",
  publie: true,
};

const inputClass =
  "mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent";
const labelClass = "block font-mono text-[11px] uppercase tracking-widest text-white/50";

function messageErreur(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "Le serveur n'a pas encore cette fonctionnalité : le backend doit être redéployé (migration en attente).";
    }
    if (err.status === 401 || err.status === 403) {
      return "Session RH invalide ou expirée — reconnectez-vous avec un compte RH.";
    }
    return err.message;
  }
  return "Opération impossible — réessayez.";
}

// Portail RH — lots (Squad Long Terme) et missions ponctuelles affichés sur
// la page vitrine /entreprises. Création, modification, masquage,
// suppression et réordonnancement sans toucher au code.
export default function OffresEntreprisesPanel() {
  const [onglet, setOnglet] = useState<Onglet>("lots");
  const [items, setItems] = useState<ItemRh[] | "loading" | "erreur">("loading");
  const [edition, setEdition] = useState<{ id: string | null; form: LotForm | MissionForm } | null>(null);
  const [etat, setEtat] = useState<"idle" | "saving">("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const base = `/rh/offres-entreprises/${onglet}`;

  function refresh() {
    setItems("loading");
    apiGet<ItemRh[]>(base, adminHeaders())
      .then(setItems)
      .catch((err) => {
        setItems("erreur");
        setErreur(messageErreur(err));
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [onglet]);

  function changerOnglet(o: Onglet) {
    if (o === onglet) return;
    setEdition(null);
    setErreur(null);
    setOnglet(o);
  }

  function nouveau() {
    setEdition({ id: null, form: onglet === "lots" ? LOT_VIDE : MISSION_VIDE });
  }

  function modifier(item: ItemRh) {
    if (onglet === "lots") {
      const l = item as LotRh;
      setEdition({
        id: l.id,
        form: {
          nom: l.nom,
          mission: l.mission,
          dateFinFormation: l.dateFinFormation.slice(0, 10),
          statutLabel: l.statutLabel,
          segment: l.segment,
          publie: l.publie,
        },
      });
    } else {
      const m = item as MissionRh;
      setEdition({
        id: m.id,
        form: {
          titre: m.titre,
          sousTitre: m.sousTitre,
          description: m.description,
          disponible: m.disponible,
          detailStatut: m.detailStatut,
          ctaLabel: m.ctaLabel,
          segment: m.segment,
          publie: m.publie,
        },
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enregistrer() {
    if (!edition) return;
    setEtat("saving");
    setErreur(null);
    try {
      // Segment vide à la création → généré côté serveur à partir du nom.
      const { segment, ...reste } = edition.form;
      const payload = {
        ...reste,
        ...(segment.trim() ? { segment: segment.trim() } : {}),
      };
      if (edition.id) await apiPut(`${base}/${edition.id}`, payload, adminHeaders());
      else await apiPostAuthed(base, payload, adminHeaders());
      setEdition(null);
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEtat("idle");
    }
  }

  async function patch(item: ItemRh, data: Record<string, unknown>) {
    setErreur(null);
    try {
      await apiPut(`${base}/${item.id}`, data, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  // Échange l'ordre avec le voisin (les ordres sont renormalisés 0..n-1 pour
  // éviter les égalités après suppressions).
  async function deplacer(index: number, delta: -1 | 1) {
    if (!Array.isArray(items)) return;
    const cible = index + delta;
    if (cible < 0 || cible >= items.length) return;
    const ordonnes = [...items];
    [ordonnes[index], ordonnes[cible]] = [ordonnes[cible], ordonnes[index]];
    setErreur(null);
    try {
      await Promise.all(
        ordonnes.map((it, i) =>
          it.ordre === i ? null : apiPut(`${base}/${it.id}`, { ordre: i }, adminHeaders())
        )
      );
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  async function supprimer(item: ItemRh) {
    const nom = "nom" in item ? item.nom : item.titre;
    if (!window.confirm(`Supprimer « ${nom} » ? Cette action est définitive.`)) return;
    setErreur(null);
    try {
      await apiDelete(`${base}/${item.id}`, adminHeaders());
      refresh();
    } catch (err) {
      setErreur(messageErreur(err));
    }
  }

  const form = edition?.form;
  const setLot = (p: Partial<LotForm>) =>
    setEdition((e) => (e ? { ...e, form: { ...(e.form as LotForm), ...p } } : e));
  const setMission = (p: Partial<MissionForm>) =>
    setEdition((e) => (e ? { ...e, form: { ...(e.form as MissionForm), ...p } } : e));

  const formulaireValide = (() => {
    if (!form) return false;
    if (onglet === "lots") {
      const f = form as LotForm;
      return f.nom.trim() && f.mission.trim() && f.dateFinFormation && f.statutLabel.trim();
    }
    const f = form as MissionForm;
    return f.titre.trim() && f.sousTitre.trim() && f.description.trim() && f.detailStatut.trim() && f.ctaLabel.trim();
  })();

  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Offres Entreprises (B2B)</h3>
            <p className="mt-1 font-mono text-[11px] text-white/40">
              Lots et missions affichés sur la page /entreprises. Les modifications sont visibles
              sur le site sous une minute.
            </p>
          </div>
          {!edition && (
            <Button variant="dark" onClick={nouveau}>
              {onglet === "lots" ? "+ Nouveau lot" : "+ Nouvelle mission"}
            </Button>
          )}
        </div>

        <div className="mt-5 flex gap-2 border-b border-white/10">
          {(["lots", "missions"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => changerOnglet(o)}
              className={`-mb-px border-b-2 px-4 py-2 font-mono text-xs uppercase tracking-widest ${
                onglet === o ? "border-accent text-accent" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {o === "lots" ? "Lots (Squad)" : "Missions ponctuelles"}
            </button>
          ))}
        </div>

        {erreur && <p className="mt-4 font-sans text-sm text-accent">{erreur}</p>}

        {edition && form && (
          <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <p className="font-sans text-sm font-semibold text-white">
              {edition.id ? "Modifier" : onglet === "lots" ? "Nouveau lot" : "Nouvelle mission"}
            </p>

            {onglet === "lots" ? (
              <>
                <label className={labelClass}>
                  Nom du lot *
                  <input
                    className={inputClass}
                    value={(form as LotForm).nom}
                    onChange={(e) => setLot({ nom: e.target.value })}
                    placeholder='Lot de 10 "Setters"'
                  />
                </label>
                <label className={labelClass}>
                  Description *
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={(form as LotForm).mission}
                    onChange={(e) => setLot({ mission: e.target.value })}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Date de fin de formation *
                    <input
                      type="date"
                      className={inputClass}
                      value={(form as LotForm).dateFinFormation}
                      onChange={(e) => setLot({ dateFinFormation: e.target.value })}
                    />
                    <span className="mt-1 block normal-case tracking-normal text-white/40">
                      Affichée : {(form as LotForm).dateFinFormation ? formatDateFr((form as LotForm).dateFinFormation) : "—"}
                    </span>
                  </label>
                  <label className={labelClass}>
                    Texte du badge de statut *
                    <input
                      className={inputClass}
                      value={(form as LotForm).statutLabel}
                      onChange={(e) => setLot({ statutLabel: e.target.value })}
                      placeholder="En attente de déploiement"
                    />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Titre *
                    <input
                      className={inputClass}
                      value={(form as MissionForm).titre}
                      onChange={(e) => setMission({ titre: e.target.value })}
                      placeholder="Voix Off"
                    />
                  </label>
                  <label className={labelClass}>
                    Sous-titre *
                    <input
                      className={inputClass}
                      value={(form as MissionForm).sousTitre}
                      onChange={(e) => setMission({ sousTitre: e.target.value })}
                      placeholder="L'Autorité Vocale"
                    />
                  </label>
                </div>
                <label className={labelClass}>
                  Description *
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={(form as MissionForm).description}
                    onChange={(e) => setMission({ description: e.target.value })}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Détail de disponibilité / date *
                    <input
                      className={inputClass}
                      value={(form as MissionForm).detailStatut}
                      onChange={(e) => setMission({ detailStatut: e.target.value })}
                      placeholder="Prochain créneau : 10 novembre 2026."
                    />
                  </label>
                  <label className={labelClass}>
                    Libellé du bouton *
                    <input
                      className={inputClass}
                      value={(form as MissionForm).ctaLabel}
                      onChange={(e) => setMission({ ctaLabel: e.target.value })}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 font-sans text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={(form as MissionForm).disponible}
                    onChange={(e) => setMission({ disponible: e.target.checked })}
                  />
                  Disponible pour commencer (sinon : « En attente de disponibilité »)
                </label>
              </>
            )}

            <label className={labelClass}>
              Segment (identifiant technique — laissez vide pour le générer automatiquement)
              <input
                className={inputClass}
                value={form.segment}
                onChange={(e) =>
                  onglet === "lots" ? setLot({ segment: e.target.value }) : setMission({ segment: e.target.value })
                }
                placeholder={onglet === "lots" ? "lot-setters" : "mission-voix-off"}
              />
            </label>
            <label className="flex items-center gap-2 font-sans text-sm text-white/80">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={form.publie}
                onChange={(e) =>
                  onglet === "lots" ? setLot({ publie: e.target.checked }) : setMission({ publie: e.target.checked })
                }
              />
              Publié sur la vitrine
            </label>

            <div className="flex gap-3 pt-2">
              <Button variant="dark" onClick={enregistrer} disabled={etat === "saving" || !formulaireValide}>
                {etat === "saving" ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="ghostDark" onClick={() => setEdition(null)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {items === "loading" && <p className="font-sans text-sm text-white/50">Chargement...</p>}
          {items === "erreur" && <p className="font-sans text-sm text-white/50">Impossible de charger la liste.</p>}
          {Array.isArray(items) && items.length === 0 && !edition && (
            <p className="rounded border border-dashed border-white/15 p-4 font-sans text-sm text-white/50">
              Rien pour l&apos;instant — utilisez le bouton « Nouveau » pour ajouter le premier élément.
            </p>
          )}
          {Array.isArray(items) &&
            items.map((item, i) => {
              const estLot = "nom" in item;
              return (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded border border-white/10 bg-obsidian px-4 py-3 ${
                    item.publie ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => deplacer(i, -1)}
                        disabled={i === 0}
                        className="px-1 text-white/60 hover:text-accent disabled:opacity-20"
                        aria-label="Monter"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => deplacer(i, 1)}
                        disabled={i === items.length - 1}
                        className="px-1 text-white/60 hover:text-accent disabled:opacity-20"
                        aria-label="Descendre"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-white">
                        {estLot ? item.nom : item.titre}
                        {!item.publie && (
                          <span className="ml-2 font-mono text-[10px] uppercase text-white/40">masqué</span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-white/50">
                        {estLot
                          ? `Fin de formation : ${formatDateFr(item.dateFinFormation)} · ${item.statutLabel}`
                          : `${item.disponible ? "Disponible" : "En attente"} · ${item.detailStatut}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest">
                    {!estLot && (
                      <button
                        type="button"
                        onClick={() => patch(item, { disponible: !item.disponible })}
                        className="text-white/50 hover:text-accent"
                      >
                        {item.disponible ? "Marquer indispo" : "Marquer dispo"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => patch(item, { publie: !item.publie })}
                      className="text-white/50 hover:text-accent"
                    >
                      {item.publie ? "Masquer" : "Publier"}
                    </button>
                    <button type="button" onClick={() => modifier(item)} className="text-accent hover:underline">
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => supprimer(item)}
                      className="text-statusRed/70 hover:text-statusRed"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Reveal>
  );
}
