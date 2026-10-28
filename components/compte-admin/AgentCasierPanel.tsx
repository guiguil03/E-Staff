"use client";

import { useEffect, useState } from "react";
import DeconnecterPartoutButton from "./DeconnecterPartoutButton";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import DailyLineChart from "./DailyLineChart";
import ComparativeBarChart from "./ComparativeBarChart";
import { apiDelete, apiGet, apiGetBlob, apiPostAuthed, apiPut, apiUpload, ApiError } from "@/lib/api";
import { adminHeaders } from "./adminHeaders";

interface DocumentApi {
  id: string;
  filename: string;
  type: string;
  createdAt: string;
}

interface Releve {
  id?: string;
  jour: string;
  realise: number | null;
  tauxAtteint: number;
  heuresTravaillees: number;
  heuresPanne?: number;
  remarques?: string | null;
  statutValidation?: "a_valider" | "valide";
  commentaireSuperviseur?: string | null;
}

interface MissionApi {
  id: string;
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  superviseurNom: string | null;
  qualityScore: number | null;
  tarifNegocie: number | null;
  objectifJournalier: number | null;
  objectifHebdo: number | null;
  synthese: { joursSaisis: number; tauxMoyen: number | null; joursObjectifAtteint: number };
}

interface LignePaie {
  periode: string;
  clientNom: string;
  montantBase: number;
  montantPrime: number;
  retenue: number;
  primeHeuresSup: number;
  netAPayer: number;
  statut: string;
  datePaiement: string | null;
}

interface Superviseur {
  id: string;
  prenom: string;
  nom: string;
}

interface AgentCasier {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  poste: string | null;
  statut: string;
  dateEmbauche: string | null;
  salaireBase: number | null;
  peutSeConnecter: boolean;
  // Rattachement hiérarchique direct — permanent, indépendant de la
  // mission (distinct des superviseurNom portés par chaque mission
  // ci-dessous).
  superviseurId: string | null;
  superviseurNom: string | null;
  coordonneesPaiement: { type: string; numero: string; verifieLe: string | null } | null;
  contrat: DocumentApi | null;
  autresDocuments: DocumentApi[];
  missions: MissionApi[];
  candidatLie: { nom: string; email: string } | null;
  notesClient: { id: string; date: string; note: number; remarque: string | null; clientNom: string }[];
  tauxJournaliers: Releve[];
  comparatifHebdo: {
    semaine: string;
    joursSaisis: number;
    realise: number | null;
    heuresTravaillees: number;
    tauxAtteint: number;
  }[];
  tempsTravaille: {
    semaine: string;
    heuresSemaine: number;
    periode: string;
    heuresMois: number;
    heuresTotal: number;
    joursTravailles: number;
    moyenneHeuresParJour: number | null;
  };
  synthese: { joursSaisis: number; tauxMoyen: number | null; joursObjectifAtteint: number };
  pointageHebdo: {
    semaine: string;
    heuresRetardCumulees: number;
    heuresAbsenceNonJustifiee: number;
    heuresSupValidees: number;
    nbRetards: number;
    tauxAbsence: number | null;
  } | null;
  paiements: LignePaie[];
  missionActive: {
    id: string;
    clientNom: string;
    role: string;
    objectifJournalier: number | null;
    objectifHebdo: number | null;
    releves: Releve[];
  } | null;
}

const CARD = "rounded border border-white/10 bg-obsidianCard p-5";
const LABEL = "font-mono text-[11px] uppercase tracking-widest text-white/40";
const inputClass =
  "w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent";

const STATUTS = [
  { value: "essai", label: "Période d'essai" },
  { value: "actif", label: "En poste" },
  { value: "inactif", label: "Désactivé" },
] as const;

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

function fmtMontant(montant: number | null): string {
  return montant === null ? "—" : `${Math.round(montant).toLocaleString("fr-FR")} Ar`;
}

function fmtInputDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

// Jour du relevé par défaut : la date LOCALE (et pas celle d'un
// toISOString(), qui basculerait sur la veille en début de nuit à
// Antananarivo, UTC+3) — même convention que todayIso() dans
// ClientMissionModal pour la saisie de l'objectif du jour.
function aujourdhuiInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function messageErreur(err: unknown): string {
  return err instanceof ApiError || err instanceof Error ? err.message : "Une erreur est survenue.";
}

// Casier agent côté RH — la fiche complète d'un agent de production : son
// identité (modifiable), son contrat de travail, les objectifs chiffrés de
// sa mission, la saisie de son relevé journalier (c'est de là que viennent
// les taux d'atteinte affichés dans son Espace Agent) et l'état de sa paie.
export default function AgentCasierPanel({ id }: { id: string }) {
  const [casier, setCasier] = useState<AgentCasier | "loading" | "erreur">("loading");
  const [superviseurs, setSuperviseurs] = useState<Superviseur[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fiche d'identité
  const [fiche, setFiche] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    poste: "",
    statut: "essai",
    dateEmbauche: "",
    salaireBase: "",
    moyenPaiementType: "",
    ribOuMobileMoney: "",
    superviseurId: "",
  });

  // Objectifs de la mission active
  const [objectifs, setObjectifs] = useState({ journalier: "", hebdo: "" });

  // Relevé du jour
  const [releve, setReleve] = useState({
    jour: aujourdhuiInput(),
    realise: "",
    tauxAtteint: "",
    heuresTravaillees: "",
    remarques: "",
  });

  // Notes client + lien vers le test du candidat
  const [noteClient, setNoteClient] = useState({ date: aujourdhuiInput(), note: "", remarque: "" });
  const [emailCandidat, setEmailCandidat] = useState("");

  const [contratFile, setContratFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "error">("idle");

  function reload() {
    apiGet<AgentCasier>(`/agents/${id}/casier`, adminHeaders())
      .then((data) => {
        setCasier(data);
        setFiche({
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone ?? "",
          poste: data.poste ?? "",
          statut: data.statut,
          dateEmbauche: fmtInputDate(data.dateEmbauche),
          salaireBase: data.salaireBase?.toString() ?? "",
          moyenPaiementType: data.coordonneesPaiement?.type ?? "",
          ribOuMobileMoney: data.coordonneesPaiement?.numero ?? "",
          superviseurId: data.superviseurId ?? "",
        });
        setObjectifs({
          journalier: data.missionActive?.objectifJournalier?.toString() ?? "",
          hebdo: data.missionActive?.objectifHebdo?.toString() ?? "",
        });
      })
      .catch(() => setCasier("erreur"));
  }

  useEffect(reload, [id]);
  useEffect(() => {
    apiGet<Superviseur[]>("/production/superviseurs", adminHeaders())
      .then(setSuperviseurs)
      .catch(() => setSuperviseurs([]));
  }, []);

  // `casier` est chargé avant tout rendu du formulaire — comparaison avec
  // les valeurs d'origine pour ne toucher à la date de vérification que
  // si les coordonnées ont réellement bougé.
  const coordonneesOrigine =
    casier !== "loading" && casier !== "erreur"
      ? {
          type: casier.coordonneesPaiement?.type ?? "",
          numero: casier.coordonneesPaiement?.numero ?? "",
        }
      : { type: "", numero: "" };
  const coordonneesModifiees =
    fiche.moyenPaiementType.trim() !== coordonneesOrigine.type ||
    fiche.ribOuMobileMoney.trim() !== coordonneesOrigine.numero;

  async function enregistrerFiche() {
    setSaving(true);
    setError(null);
    try {
      await apiPut(
        `/agents/${id}`,
        {
          prenom: fiche.prenom,
          nom: fiche.nom,
          email: fiche.email,
          telephone: fiche.telephone.trim() || null,
          poste: fiche.poste.trim() || null,
          statut: fiche.statut,
          dateEmbauche: fiche.dateEmbauche || null,
          salaireBase: fiche.salaireBase ? Number(fiche.salaireBase) : null,
          // Coordonnées de paiement envoyées SEULEMENT si elles ont changé :
          // les transmettre à chaque enregistrement remettrait la date de
          // vérification à aujourd'hui alors que personne ne les a
          // re-vérifiées (voir AgentsService.updateAgent).
          moyenPaiementType: coordonneesModifiees
            ? fiche.moyenPaiementType.trim() || null
            : undefined,
          ribOuMobileMoney: coordonneesModifiees
            ? fiche.ribOuMobileMoney.trim() || null
            : undefined,
          superviseurId: fiche.superviseurId || null,
        },
        adminHeaders()
      );
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function enregistrerObjectifs(missionId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiPut(
        `/production/missions/${missionId}`,
        {
          objectifJournalier: objectifs.journalier ? Number(objectifs.journalier) : null,
          objectifHebdo: objectifs.hebdo ? Number(objectifs.hebdo) : null,
        },
        adminHeaders()
      );
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function enregistrerReleve(missionId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiPut(
        `/agents/missions/${missionId}/suivi-journalier`,
        {
          jour: releve.jour,
          realise: releve.realise === "" ? null : Number(releve.realise),
          tauxAtteint: releve.tauxAtteint === "" ? undefined : Number(releve.tauxAtteint),
          heuresTravaillees:
            releve.heuresTravaillees === "" ? undefined : Number(releve.heuresTravaillees),
          remarques: releve.remarques.trim() || null,
        },
        adminHeaders()
      );
      setReleve({ ...releve, realise: "", tauxAtteint: "", heuresTravaillees: "", remarques: "" });
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  // Validation d'une journée saisie par l'agent, avec une note facultative
  // (ex. "Panne fibre validée") affichée dans son historique.
  async function validerReleve(releveId: string) {
    const commentaire = window.prompt("Note pour l'agent (facultatif) :", "");
    if (commentaire === null) return;
    setSaving(true);
    setError(null);
    try {
      await apiPut(
        `/agents/suivi-journalier/${releveId}/validation`,
        { commentaire: commentaire.trim() || null },
        adminHeaders()
      );
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function rouvrirReleve(releveId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiPut(`/agents/suivi-journalier/${releveId}/reouverture`, {}, adminHeaders());
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function ajouterNoteClient(missionId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiPostAuthed(
        `/agents/missions/${missionId}/notes-client`,
        {
          date: noteClient.date,
          note: Number(noteClient.note),
          remarque: noteClient.remarque.trim() || null,
        },
        adminHeaders()
      );
      setNoteClient({ ...noteClient, note: "", remarque: "" });
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function supprimerNoteClient(noteId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiDelete(`/agents/notes-client/${noteId}`, adminHeaders());
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function ouvrirSalleBrief() {
    setError(null);
    const fenetre = window.open("", "_blank");
    try {
      const r = await apiPostAuthed<{ configured: boolean; url: string | null }>(
        `/agents/${id}/salle-brief-rh`,
        {},
        adminHeaders()
      );
      if (r.url && fenetre) {
        fenetre.location.href = r.url;
      } else {
        fenetre?.close();
        setError(
          r.configured
            ? "Impossible d'ouvrir la salle de brief."
            : "La salle virtuelle n'est pas activée (clé Daily absente)."
        );
      }
    } catch (err) {
      fenetre?.close();
      setError(messageErreur(err));
    }
  }

  async function lierCandidat() {
    setSaving(true);
    setError(null);
    try {
      await apiPut(`/agents/${id}/candidat`, { email: emailCandidat.trim() }, adminHeaders());
      setEmailCandidat("");
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function delierCandidat() {
    setSaving(true);
    setError(null);
    try {
      await apiDelete(`/agents/${id}/candidat`, adminHeaders());
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function supprimerReleve(releveId: string) {
    setSaving(true);
    setError(null);
    try {
      await apiDelete(`/agents/suivi-journalier/${releveId}`, adminHeaders());
      reload();
    } catch (err) {
      setError(messageErreur(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadContrat() {
    if (!contratFile) return;
    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", contratFile);
    try {
      await apiUpload(`/agents/${id}/contrat`, formData, adminHeaders());
      setContratFile(null);
      setUploadStatus("idle");
      reload();
    } catch {
      setUploadStatus("error");
    }
  }

  async function telecharger(doc: DocumentApi) {
    const blob = await apiGetBlob(`/agents/documents/${doc.id}`, adminHeaders()).catch(() => null);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Impossible de charger ce casier.</p>;

  return (
    <div className="space-y-4">
      <Reveal>
        <div className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={LABEL}>Agent · {casier.matricule}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-white">
                {casier.prenom} {casier.nom}
              </h2>
              <p className="mt-1 font-sans text-sm text-white/60">
                {casier.poste ?? "Poste non renseigné"} ·{" "}
                {casier.peutSeConnecter ? "accès actif" : "aucun mot de passe émis"}
              </p>
            </div>
            <DeconnecterPartoutButton matricule={casier.matricule} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={LABEL} htmlFor="casier-prenom">
                Prénom
              </label>
              <input
                id="casier-prenom"
                className={`mt-1 ${inputClass}`}
                value={fiche.prenom}
                onChange={(e) => setFiche({ ...fiche, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-nom">
                Nom
              </label>
              <input
                id="casier-nom"
                className={`mt-1 ${inputClass}`}
                value={fiche.nom}
                onChange={(e) => setFiche({ ...fiche, nom: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-email">
                E-mail
              </label>
              <input
                id="casier-email"
                type="email"
                className={`mt-1 ${inputClass}`}
                value={fiche.email}
                onChange={(e) => setFiche({ ...fiche, email: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-telephone">
                Téléphone
              </label>
              <input
                id="casier-telephone"
                className={`mt-1 ${inputClass}`}
                value={fiche.telephone}
                onChange={(e) => setFiche({ ...fiche, telephone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-poste">
                Poste
              </label>
              <input
                id="casier-poste"
                className={`mt-1 ${inputClass}`}
                value={fiche.poste}
                onChange={(e) => setFiche({ ...fiche, poste: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-statut">
                Statut
              </label>
              <select
                id="casier-statut"
                className={`mt-1 ${inputClass}`}
                value={fiche.statut}
                onChange={(e) => setFiche({ ...fiche, statut: e.target.value })}
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-superviseur">
                Superviseur
              </label>
              <select
                id="casier-superviseur"
                className={`mt-1 ${inputClass}`}
                value={fiche.superviseurId}
                onChange={(e) => setFiche({ ...fiche, superviseurId: e.target.value })}
              >
                <option value="">— Non assigné —</option>
                {superviseurs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.prenom} {s.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-embauche">
                Date d&apos;embauche
              </label>
              <input
                id="casier-embauche"
                type="date"
                className={`mt-1 ${inputClass}`}
                value={fiche.dateEmbauche}
                onChange={(e) => setFiche({ ...fiche, dateEmbauche: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-salaire">
                Salaire de base (Ar / mois)
              </label>
              <input
                id="casier-salaire"
                type="number"
                min={0}
                className={`mt-1 ${inputClass}`}
                value={fiche.salaireBase}
                onChange={(e) => setFiche({ ...fiche, salaireBase: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="casier-moyen">
                Moyen de paiement
              </label>
              <input
                id="casier-moyen"
                className={`mt-1 ${inputClass}`}
                value={fiche.moyenPaiementType}
                onChange={(e) => setFiche({ ...fiche, moyenPaiementType: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="casier-rib">
                Numéro RIB / Mobile Money
              </label>
              <input
                id="casier-rib"
                className={`mt-1 ${inputClass}`}
                value={fiche.ribOuMobileMoney}
                onChange={(e) => setFiche({ ...fiche, ribOuMobileMoney: e.target.value })}
              />
              <p className="mt-1 font-sans text-xs text-white/40">
                Toute modification des coordonnées remet la date de vérification à aujourd&apos;hui
                {casier.coordonneesPaiement?.verifieLe
                  ? ` (dernière vérification : ${fmtDate(casier.coordonneesPaiement.verifieLe)})`
                  : ""}
                .
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="dark" onClick={enregistrerFiche} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer la fiche"}
            </Button>
          </div>
          {error && <p className="mt-3 font-sans text-sm text-accent">{error}</p>}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Contrat de travail</h3>
          {casier.contrat ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-obsidian px-4 py-3">
              <div>
                <p className="font-sans text-sm text-white">{casier.contrat.filename}</p>
                <p className="mt-0.5 font-sans text-xs text-white/40">
                  Déposé le {fmtDate(casier.contrat.createdAt)} — visible par l&apos;agent dans son
                  espace
                </p>
              </div>
              <button
                onClick={() => telecharger(casier.contrat as DocumentApi)}
                className="rounded border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-obsidian"
              >
                Télécharger
              </button>
            </div>
          ) : (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucun contrat déposé. L&apos;agent verra « aucun contrat » dans son espace.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setContratFile(e.target.files?.[0] ?? null)}
              className="font-sans text-xs text-white/60"
            />
            <Button variant="ghostDark" onClick={uploadContrat} disabled={!contratFile || uploadStatus === "uploading"}>
              {uploadStatus === "uploading" ? "Envoi..." : "Déposer le contrat"}
            </Button>
            {uploadStatus === "error" && (
              <p className="font-sans text-sm text-accent">
                Échec de l&apos;envoi — PDF ou Word, 20 Mo max.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {casier.missionActive ? (
        <Reveal>
          <div className={CARD}>
            <h3 className="font-display text-lg font-semibold text-white">
              Mission en cours — {casier.missionActive.clientNom}
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Poste : {casier.missionActive.role}. Les objectifs chiffrés servent à calculer les
              taux d&apos;atteinte de l&apos;agent (journalier et hebdomadaire).
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={LABEL} htmlFor="obj-jour">
                  Objectif journalier
                </label>
                <input
                  id="obj-jour"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputClass}`}
                  value={objectifs.journalier}
                  onChange={(e) => setObjectifs({ ...objectifs, journalier: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="obj-hebdo">
                  Objectif hebdomadaire
                </label>
                <input
                  id="obj-hebdo"
                  type="number"
                  min={0}
                  className={`mt-1 ${inputClass}`}
                  value={objectifs.hebdo}
                  onChange={(e) => setObjectifs({ ...objectifs, hebdo: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghostDark"
                  onClick={() => enregistrerObjectifs(casier.missionActive!.id)}
                  disabled={saving}
                >
                  Enregistrer les objectifs
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h4 className="font-display text-base font-semibold text-white">
                Relevé journalier
              </h4>
              <p className="mt-1 font-sans text-xs text-white/50">
                Un relevé par jour. Avec un objectif journalier fixé, le taux est calculé depuis le
                réalisé ; sinon saisissez le taux directement.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className={LABEL} htmlFor="rel-jour">
                    Jour
                  </label>
                  <input
                    id="rel-jour"
                    type="date"
                    className={`mt-1 ${inputClass}`}
                    value={releve.jour}
                    onChange={(e) => setReleve({ ...releve, jour: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="rel-realise">
                    Réalisé
                  </label>
                  <input
                    id="rel-realise"
                    type="number"
                    min={0}
                    className={`mt-1 ${inputClass}`}
                    value={releve.realise}
                    onChange={(e) => setReleve({ ...releve, realise: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="rel-taux">
                    Taux (%)
                  </label>
                  <input
                    id="rel-taux"
                    type="number"
                    min={0}
                    disabled={casier.missionActive.objectifJournalier !== null}
                    placeholder={
                      casier.missionActive.objectifJournalier !== null ? "calculé" : "ex. 90"
                    }
                    className={`mt-1 ${inputClass} disabled:opacity-40`}
                    value={releve.tauxAtteint}
                    onChange={(e) => setReleve({ ...releve, tauxAtteint: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="rel-heures">
                    Heures travaillées
                  </label>
                  <input
                    id="rel-heures"
                    type="number"
                    min={0}
                    step="0.25"
                    className={`mt-1 ${inputClass}`}
                    value={releve.heuresTravaillees}
                    onChange={(e) => setReleve({ ...releve, heuresTravaillees: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="rel-remarques">
                    Remarque
                  </label>
                  <input
                    id="rel-remarques"
                    className={`mt-1 ${inputClass}`}
                    value={releve.remarques}
                    onChange={(e) => setReleve({ ...releve, remarques: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="dark"
                  onClick={() => enregistrerReleve(casier.missionActive!.id)}
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer le relevé"}
                </Button>
              </div>

              {casier.missionActive.releves.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className={`${LABEL} py-2`}>Jour</th>
                        <th className={`${LABEL} py-2`}>Réalisé</th>
                        <th className={`${LABEL} py-2`}>Taux</th>
                        <th className={`${LABEL} py-2`}>Heures</th>
                        <th className={`${LABEL} py-2`}>Panne</th>
                        <th className={`${LABEL} py-2`}>Statut</th>
                        <th className={`${LABEL} py-2`}>Remarque</th>
                        <th className={`${LABEL} py-2`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {casier.missionActive.releves.map((r) => (
                        <tr key={r.id} className="border-b border-white/5">
                          <td className="py-2 font-mono text-xs text-white/70">
                            {fmtDate(r.jour)}
                          </td>
                          <td className="py-2 font-sans text-sm text-white">{r.realise ?? "—"}</td>
                          <td className="py-2 font-sans text-sm text-accent">{r.tauxAtteint}%</td>
                          <td className="py-2 font-sans text-sm text-white">
                            {r.heuresTravaillees} h
                          </td>
                          <td className="py-2 font-sans text-sm text-white">
                            {r.heuresPanne ?? 0} h
                          </td>
                          <td className="py-2 font-sans text-sm text-white/70">
                            {r.statutValidation === "a_valider" ? "À valider" : "Validé"}
                            {r.commentaireSuperviseur && (
                              <span className="block text-xs italic text-white/50">
                                « {r.commentaireSuperviseur} »
                              </span>
                            )}
                          </td>
                          <td className="py-2 font-sans text-xs text-white/50">
                            {r.remarques ?? "—"}
                          </td>
                          <td className="py-2 text-right">
                            {r.id && r.statutValidation === "a_valider" && (
                              <button
                                onClick={() => validerReleve(r.id!)}
                                disabled={saving}
                                className="mr-3 font-mono text-[11px] uppercase tracking-widest text-accent hover:underline disabled:opacity-40"
                              >
                                Valider
                              </button>
                            )}
                            {r.id && r.statutValidation === "valide" && (
                              <button
                                onClick={() => rouvrirReleve(r.id!)}
                                disabled={saving}
                                className="mr-3 font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-40"
                              >
                                Rouvrir
                              </button>
                            )}
                            <button
                              onClick={() => r.id && supprimerReleve(r.id)}
                              disabled={saving}
                              className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-40"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <div className={CARD}>
            <h3 className="font-display text-lg font-semibold text-white">Mission en cours</h3>
            <p className="mt-2 font-sans text-sm text-white/50">
              Cet agent n&apos;est affecté à aucune mission. Affectez-le à un contrat depuis
              Production &gt; Agents en production pour pouvoir saisir ses objectifs et son relevé
              journalier.
            </p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">
            Retours du client &amp; test du candidat
          </h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Ce que vous saisissez ici apparaît dans « Mon casier » de l&apos;agent.
          </p>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="font-display text-base font-semibold text-white">Salle de brief</h4>
            <p className="mt-1 font-sans text-xs text-white/50">
              Visio de la mission active, partagée avec l&apos;agent.
            </p>
            <div className="mt-2">
              <Button variant="ghostDark" onClick={ouvrirSalleBrief}>
                🎥 Ouvrir la salle de brief
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="font-display text-base font-semibold text-white">Test du candidat</h4>
            {casier.candidatLie ? (
              <p className="mt-2 font-sans text-sm text-white/70">
                Rattaché à <span className="text-white">{casier.candidatLie.nom}</span> (
                {casier.candidatLie.email}){" "}
                <button
                  onClick={delierCandidat}
                  disabled={saving}
                  className="ml-2 font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-40"
                >
                  Détacher
                </button>
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1">
                  <label className={LABEL} htmlFor="cand-email">
                    E-mail du candidat
                  </label>
                  <input
                    id="cand-email"
                    type="email"
                    className={`mt-1 ${inputClass}`}
                    value={emailCandidat}
                    onChange={(e) => setEmailCandidat(e.target.value)}
                  />
                </div>
                <Button variant="ghostDark" onClick={lierCandidat} disabled={saving || !emailCandidat.trim()}>
                  Rattacher
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="font-display text-base font-semibold text-white">Note du client</h4>
            {casier.missionActive ? (
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={LABEL} htmlFor="nc-date">
                    Date
                  </label>
                  <input
                    id="nc-date"
                    type="date"
                    className={`mt-1 ${inputClass}`}
                    value={noteClient.date}
                    onChange={(e) => setNoteClient({ ...noteClient, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="nc-note">
                    Note (/5)
                  </label>
                  <input
                    id="nc-note"
                    type="number"
                    min={0}
                    max={5}
                    step="0.5"
                    className={`mt-1 ${inputClass}`}
                    value={noteClient.note}
                    onChange={(e) => setNoteClient({ ...noteClient, note: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL} htmlFor="nc-remarque">
                    Remarque du client
                  </label>
                  <input
                    id="nc-remarque"
                    className={`mt-1 ${inputClass}`}
                    value={noteClient.remarque}
                    onChange={(e) => setNoteClient({ ...noteClient, remarque: e.target.value })}
                  />
                </div>
                <div>
                  <Button
                    variant="dark"
                    onClick={() => ajouterNoteClient(casier.missionActive!.id)}
                    disabled={saving || noteClient.note === "" || Number(noteClient.note) > 5}
                  >
                    Ajouter la note
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 font-sans text-sm text-white/50">
                Aucune mission active : affectez l&apos;agent à un contrat pour saisir un retour client.
              </p>
            )}

            {casier.notesClient.length > 0 && (
              <ul className="mt-3 space-y-2">
                {casier.notesClient.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-start justify-between gap-2 border-b border-white/5 pb-2"
                  >
                    <p className="font-sans text-sm text-white/80">
                      <span className="font-mono text-xs text-white/50">{fmtDate(n.date)}</span> ·{" "}
                      {n.clientNom} · <span className="text-accent">{n.note}/5</span>
                      {n.remarque && <span className="italic text-white/60"> — « {n.remarque} »</span>}
                    </p>
                    <button
                      onClick={() => supprimerNoteClient(n.id)}
                      disabled={saving}
                      className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-accent disabled:opacity-40"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-3 lg:grid-cols-2">
        <Reveal>
          <div className={`${CARD} h-full`}>
            <h3 className="font-display text-lg font-semibold text-white">
              Objectif atteint — par jour
            </h3>
            {casier.tauxJournaliers.length === 0 ? (
              <p className="mt-3 font-sans text-sm text-white/50">Aucun relevé journalier.</p>
            ) : (
              <DailyLineChart
                data={casier.tauxJournaliers.map((r) => ({
                  label: new Date(r.jour).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  }),
                  value: r.tauxAtteint,
                }))}
              />
            )}
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
              <div>
                <dt className={LABEL}>Taux moyen</dt>
                <dd className="mt-1 font-display text-lg font-bold text-accent">
                  {casier.synthese.tauxMoyen !== null ? `${casier.synthese.tauxMoyen}%` : "—"}
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Jours à 100%</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">
                  {casier.synthese.joursObjectifAtteint}
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Jours saisis</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">
                  {casier.synthese.joursSaisis}
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal>
          <div className={`${CARD} h-full`}>
            <h3 className="font-display text-lg font-semibold text-white">
              Comparatif hebdomadaire
            </h3>
            {casier.comparatifHebdo.length === 0 ? (
              <p className="mt-3 font-sans text-sm text-white/50">Aucune semaine renseignée.</p>
            ) : (
              <ComparativeBarChart
                data={casier.comparatifHebdo.map((s) => ({
                  label: `S${s.semaine.split("-W")[1]}`,
                  value: s.tauxAtteint,
                }))}
                maxValue={Math.max(100, ...casier.comparatifHebdo.map((s) => s.tauxAtteint))}
                valueSuffix="%"
              />
            )}
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
              <div>
                <dt className={LABEL}>Heures semaine</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">
                  {casier.tempsTravaille.heuresSemaine} h
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Heures mois</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">
                  {casier.tempsTravaille.heuresMois} h
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Cumul</dt>
                <dd className="mt-1 font-display text-lg font-bold text-white">
                  {casier.tempsTravaille.heuresTotal} h
                </dd>
              </div>
            </dl>
            {casier.pointageHebdo && (
              <p className="mt-3 font-sans text-xs text-white/50">
                Pointage {casier.pointageHebdo.semaine} : {casier.pointageHebdo.heuresSupValidees} h
                sup., {casier.pointageHebdo.heuresRetardCumulees} h de retard,{" "}
                {casier.pointageHebdo.heuresAbsenceNonJustifiee} h d&apos;absence non justifiée.
              </p>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Paie</h3>
          <p className="mt-1 font-sans text-xs text-white/50">
            Lignes établies côté Paie &amp; Commissions — l&apos;agent voit les mêmes montants dans
            son espace.
          </p>
          {casier.paiements.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">
              Aucune ligne de paie pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Période</th>
                    <th className={`${LABEL} py-2`}>Client</th>
                    <th className={`${LABEL} py-2`}>Base</th>
                    <th className={`${LABEL} py-2`}>Retenue</th>
                    <th className={`${LABEL} py-2`}>Prime</th>
                    <th className={`${LABEL} py-2`}>Net</th>
                    <th className={`${LABEL} py-2`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {casier.paiements.map((p) => (
                    <tr key={`${p.periode}-${p.clientNom}`} className="border-b border-white/5">
                      <td className="py-2 font-mono text-xs text-white/70">{p.periode}</td>
                      <td className="py-2 font-sans text-sm text-white">{p.clientNom}</td>
                      <td className="py-2 font-mono text-xs text-white">
                        {fmtMontant(p.montantBase)}
                      </td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {p.retenue > 0 ? `− ${fmtMontant(p.retenue)}` : "—"}
                      </td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {fmtMontant(p.montantPrime + p.primeHeuresSup)}
                      </td>
                      <td className="py-2 font-mono text-sm text-accent">
                        {fmtMontant(p.netAPayer)}
                      </td>
                      <td className="py-2 font-sans text-xs text-white/70">
                        {p.statut === "paye" ? `Payé le ${fmtDate(p.datePaiement)}` : "En attente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className={CARD}>
          <h3 className="font-display text-lg font-semibold text-white">Historique des missions</h3>
          {casier.missions.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-white/50">Aucune mission enregistrée.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${LABEL} py-2`}>Client</th>
                    <th className={`${LABEL} py-2`}>Poste</th>
                    <th className={`${LABEL} py-2`}>Période</th>
                    <th className={`${LABEL} py-2`}>Superviseur</th>
                    <th className={`${LABEL} py-2`}>Tarif négocié</th>
                    <th className={`${LABEL} py-2`}>Taux moyen</th>
                    <th className={`${LABEL} py-2`}>Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {casier.missions.map((m) => (
                    <tr key={m.id} className="border-b border-white/5">
                      <td className="py-2 font-sans text-sm text-white">{m.clientNom}</td>
                      <td className="py-2 font-sans text-sm text-white/70">{m.role}</td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {fmtDate(m.dateDebut)} → {m.dateFin ? fmtDate(m.dateFin) : "en cours"}
                      </td>
                      <td className="py-2 font-sans text-sm text-white/70">
                        {m.superviseurNom ?? "—"}
                      </td>
                      <td className="py-2 font-mono text-xs text-white/70">
                        {fmtMontant(m.tarifNegocie)}
                      </td>
                      <td className="py-2 font-sans text-sm text-accent">
                        {m.synthese.tauxMoyen !== null ? `${m.synthese.tauxMoyen}%` : "—"}
                      </td>
                      <td className="py-2 font-sans text-sm text-white/70">
                        {m.qualityScore !== null ? `${m.qualityScore}/5` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
