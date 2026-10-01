// Offres d'emploi de la vitrine Studio Métier — renvoyées par
// GET /offres-emploi (backend/src/offres-emploi). Le statut est calculé
// côté serveur (voir backend/src/offres-emploi/statut.ts), jamais ici.
export type StatutOffre = "ouvert" | "presque_complet" | "cloture";
export type MotifCloture = "complet" | "date_limite" | "manuel";

export interface OffreEmploi {
  id: string;
  metierSlug: string;
  titre: string;
  drapeau: string | null;
  modalites: string[];
  projet: string | null;
  remuneration: string | null;
  prerequis: string | null;
  placesTotal: number;
  placesPourvues: number;
  dateLimite: string | null;
  cloturee: boolean;
  lienWhatsapp: string | null;
  createdAt: string;
  statut: StatutOffre;
  motifCloture: MotifCloture | null;
  placesRestantes: number;
  tauxRemplissage: number;
}

// Libellé du badge de disponibilité (cahier des charges cliente du
// 2026-09-19 : 🟢 places disponibles / 🟠 dernières places / 🔴 complète).
export function badgeOffre(o: Pick<OffreEmploi, "statut" | "motifCloture" | "placesRestantes" | "placesTotal">): {
  emoji: string;
  texte: string;
  tone: "vert" | "orange" | "rouge";
} {
  if (o.statut === "cloture") {
    const texte =
      o.motifCloture === "date_limite"
        ? "Candidatures closes (date limite dépassée)"
        : o.motifCloture === "manuel"
          ? "Offre clôturée (Candidatures fermées)"
          : "Offre complète (Candidatures fermées)";
    return { emoji: "🔴", texte, tone: "rouge" };
  }
  if (o.statut === "presque_complet") {
    return {
      emoji: "🟠",
      texte:
        o.placesRestantes > 1
          ? `Plus que ${o.placesRestantes} places disponibles !`
          : "Plus que 1 place disponible !",
      tone: "orange",
    };
  }
  return {
    emoji: "🟢",
    texte: `${o.placesRestantes} place${o.placesRestantes > 1 ? "s" : ""} restante${
      o.placesRestantes > 1 ? "s" : ""
    } sur ${o.placesTotal}`,
    tone: "vert",
  };
}

export function formatDateLimite(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Aperçu en direct dans le formulaire du Portail RH, avant enregistrement —
// même règle que backend/src/offres-emploi/statut.ts (source de vérité,
// c'est lui qui décide sur la vitrine et à la candidature).
export function statutApercu(
  o: Pick<OffreEmploi, "placesTotal" | "placesPourvues" | "dateLimite" | "cloturee">,
  now: Date = new Date()
): Pick<OffreEmploi, "statut" | "motifCloture" | "placesRestantes" | "tauxRemplissage"> {
  const total = Math.max(0, o.placesTotal);
  const pourvues = Math.min(Math.max(0, o.placesPourvues), total);
  const placesRestantes = total - pourvues;
  const tauxRemplissage = total > 0 ? Math.round((pourvues / total) * 100) : 100;
  const motifCloture: MotifCloture | null = o.cloturee
    ? "manuel"
    : placesRestantes === 0
      ? "complet"
      : o.dateLimite && new Date(o.dateLimite).getTime() < now.getTime()
        ? "date_limite"
        : null;
  const statut: StatutOffre = motifCloture
    ? "cloture"
    : placesRestantes <= Math.max(1, Math.floor(total * 0.2))
      ? "presque_complet"
      : "ouvert";
  return { statut, motifCloture, placesRestantes, tauxRemplissage };
}
