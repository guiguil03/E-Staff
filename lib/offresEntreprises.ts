// Lots & missions de la page vitrine /entreprises. Source de vérité : l'API
// (GET /entreprises/offres, éditée depuis le Portail RH). Les valeurs
// ci-dessous ne servent que de secours si l'API est injoignable.
export interface LotEntreprise {
  id: string;
  nom: string;
  mission: string;
  dateFinFormation: string;
  segment: string;
  statutLabel: string;
  ordre: number;
}

export interface MissionEntreprise {
  id: string;
  titre: string;
  sousTitre: string;
  description: string;
  disponible: boolean;
  detailStatut: string;
  ctaLabel: string;
  segment: string;
  ordre: number;
}

export interface OffresEntreprises {
  lots: LotEntreprise[];
  missions: MissionEntreprise[];
}

// Date affichée sur la vitrine : « 15 août 2026 », « 1er septembre 2026 ».
// Les dates sont stockées à minuit UTC → on formate en UTC pour ne jamais
// décaler d'un jour.
export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const jour = d.getUTCDate() === 1 ? "1er" : String(d.getUTCDate());
  const moisAnnee = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  return `${jour} ${moisAnnee}`;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL_Dev ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"
).replace(/\/+$/, "");

export async function fetchOffresEntreprises(): Promise<OffresEntreprises> {
  try {
    const res = await fetch(`${API_URL}/entreprises/offres`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as OffresEntreprises;
  } catch {
    return FALLBACK;
  }
}

const lot = (
  ordre: number,
  segment: string,
  nom: string,
  mission: string,
  dateFinFormation: string
): LotEntreprise => ({
  id: segment,
  ordre,
  segment,
  nom,
  mission,
  dateFinFormation,
  statutLabel: "En attente de déploiement",
});

const FALLBACK: OffresEntreprises = {
  lots: [
    lot(0, "lot-setters", 'Lot de 10 "Setters"', "Saturez vos agendas, brisez les barrières et qualifiez un maximum de prospects pour remplir votre pipeline commercial.", "2026-08-15"),
    lot(1, "lot-closers", 'Lot de 10 "Closers"', "Maîtrisez la négociation à fort impact, éliminez les dernières objections et transformez vos prospects chauds en cash immédiat.", "2026-08-18"),
    lot(2, "lot-collecte-dons", 'Lot de 10 "Campagnes Collecte de Dons"', "Maniez la persuasion avec une rigueur absolue pour convaincre, engager et décrocher des prélèvements automatiques et des dons à fort volume.", "2026-08-25"),
    lot(3, "lot-campagnes-mailing", 'Lot de 10 "Campagnes & Mailing"', "Inondez les boîtes de réception et pilotez des campagnes de prospection écrite à haut taux de conversion.", "2026-09-01"),
    lot(4, "lot-operateurs-telephoniques", 'Lot de 10 "Opérateurs Téléphoniques & Support"', "Maîtrisez la voix, encadrez chaque interaction et gérez vos flux de support et d'appels massifs sans fausse note.", "2026-08-10"),
    lot(5, "lot-saisie-back-office", 'Lot de 10 "Opérateurs de Saisie & Back-Office"', "Alimentez vos CRM, nettoyez vos fichiers et garantissez une rigueur administrative infaillible.", "2026-08-20"),
  ],
  missions: [
    { id: "mission-voix-off", ordre: 0, segment: "mission-voix-off", titre: "Voix Off", sousTitre: "L'Autorité Vocale", description: "Ne confiez pas votre image à une voix sans relief. Dominez l'attention dès la première seconde sur vos spots publicitaires, modules e-learning ou vidéos de vente.", disponible: true, detailStatut: "Livraison sous 24/48h.", ctaLabel: "Démarrer ce projet" },
    { id: "mission-montage-video", ordre: 1, segment: "mission-montage-video", titre: "Montage Vidéo", sousTitre: "Le Rythme qui Perce", description: "Captivez les algorithmes et pulvérisez l'attention. Du format court (TikTok, Reels, Shorts) au montage institutionnel.", disponible: true, detailStatut: "Livraison rapide, délai communiqué sur devis.", ctaLabel: "Démarrer ce projet" },
    { id: "mission-assistanat-virtuel", ordre: 2, segment: "mission-assistanat-virtuel", titre: "Assistanat Virtuel", sousTitre: "Le Sceau de l'Exécutif", description: "Vous êtes dirigeant, pas secrétaire. Libérez votre temps stratégique en déléguant la gestion d'agendas complexes et le filtrage d'urgence à une élite rigoureuse.", disponible: false, detailStatut: "Prochain créneau : 10 Août 2026.", ctaLabel: "Réserver mon créneau" },
    { id: "mission-copywriting", ordre: 3, segment: "mission-copywriting", titre: "Copywriting & Rédaction", sousTitre: "Les Mots qui Frappent", description: "Pages de vente, e-mails et scripts rédigés pour convertir, pas seulement pour être lus.", disponible: true, detailStatut: "Disponible immédiatement.", ctaLabel: "Démarrer ce projet" },
  ],
};
