import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Agrégats réels du Cockpit Formateur — remplace les widgets qui tournaient
// sur components/compte-formateur/exampleData.ts (Vivier C1, moyennes de
// groupe, courbe d'évolution, rapport hebdo) depuis 2026-08-24. Même
// convention de "moyenne globale" que l'ancien mock : somme des 5 notes de
// compétence (/20 chacune) de la séance la plus avancée où les 5 sont
// notées pour cet apprenant — équivalent à l'ancien `moyenneGlobale`/100.
// N'inclut PAS les "Alertes Paiements / renouvellements" : aucune donnée
// d'abonnement/échéance n'existe en base (Apprenant n'a pas ces champs) —
// nécessite une décision produit sur le modèle de renouvellement avant de
// pouvoir les brancher, voir la conversation du 2026-08-24.
const COMPETENCIES = [
  "comprehension_orale",
  "expression_orale",
  "comprehension_ecrite",
  "expression_ecrite",
  "posture_eloquence",
] as const;

const VIVIER_C1_THRESHOLD = 75; // /100 — même seuil que l'ancien exampleData.ts
// Séances considérées "passées" pour la courbe d'évolution — même
// convention que DERNIERE_SEANCE_PASSEE côté front (exampleData.ts).
const EVOLUTION_SEANCES = [1, 2, 3, 4];
// Taux d'absence au-delà duquel un apprenant est marqué "alerte décrochage"
// dans le détail de groupe — pas de seuil client fourni, choisi par analogie
// avec le seul cas illustré dans l'ancien exampleData.ts (~20%, ajusté ici à
// 15% pour déclencher un peu plus tôt).
const ALERTE_DECROCHAGE_TAUX_ABSENCE = 15;

interface RawApprenant {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  groupeId: string;
  groupe: { id: string; cle: string; label: string };
}

@Injectable()
export class CockpitService {
  constructor(private readonly prisma: PrismaService) {}

  // Charge tout ce dont les agrégats ci-dessous ont besoin en 4 requêtes,
  // puis tout le calcul se fait en mémoire (volumes petits : 30 apprenants,
  // 72 séances) — évite le N+1 d'une requête par apprenant.
  private async loadRaw() {
    const now = new Date();
    const [apprenants, notations, seancesPassees, presences] = await Promise.all([
      this.prisma.apprenant.findMany({ include: { groupe: true } }),
      this.prisma.notation.findMany({
        where: { scoreOn20: { not: null } },
        include: { seance: true },
      }),
      this.prisma.seance.findMany({ where: { startAt: { not: null, lt: now } } }),
      this.prisma.presence.findMany({ where: { apprenantId: { not: null }, role: "apprenant" } }),
    ]);
    return { apprenants: apprenants as RawApprenant[], notations, seancesPassees, presences };
  }

  // apprenantId -> numero de séance -> { compétence: score }
  private buildScoresParApprenant(
    notations: { apprenantId: string; competence: string; scoreOn20: number | null; seance: { numero: number } }[]
  ): Map<string, Map<number, Record<string, number>>> {
    const map = new Map<string, Map<number, Record<string, number>>>();
    for (const n of notations) {
      if (n.scoreOn20 === null) continue;
      let bySeance = map.get(n.apprenantId);
      if (!bySeance) {
        bySeance = new Map();
        map.set(n.apprenantId, bySeance);
      }
      const scores = bySeance.get(n.seance.numero) ?? {};
      scores[n.competence] = n.scoreOn20;
      bySeance.set(n.seance.numero, scores);
    }
    return map;
  }

  // "Moyenne globale" /100 d'un apprenant = somme des 5 compétences à la
  // séance la plus avancée où elles sont toutes notées. null tant qu'aucune
  // séance n'est complètement notée pour lui.
  private moyenneGlobale(bySeance: Map<number, Record<string, number>> | undefined): number | null {
    if (!bySeance) return null;
    let best: number | null = null;
    let bestNumero = -1;
    for (const [numero, scores] of bySeance) {
      if (numero > bestNumero && COMPETENCIES.every((c) => scores[c] !== undefined)) {
        bestNumero = numero;
        best = Math.round(COMPETENCIES.reduce((sum, c) => sum + scores[c], 0) * 100) / 100;
      }
    }
    return best;
  }

  private statutFor(moyenne: number | null): "vert" | "orange" | "rouge" {
    if (moyenne === null) return "rouge";
    if (moyenne >= 75) return "vert";
    if (moyenne >= 60) return "orange";
    return "rouge";
  }

  // Taux d'absence par apprenant, sur les séances déjà passées et
  // planifiées (startAt renseigné et écoulé) de son groupe — % de ces
  // séances où aucune ligne Presence(role=apprenant) n'existe pour lui.
  // null si son groupe n'a encore aucune séance passée planifiée.
  private buildTauxAbsence(
    apprenants: RawApprenant[],
    seancesPassees: { id: string; groupeId: string }[],
    presences: { apprenantId: string | null; seanceId: string }[]
  ): Map<string, number | null> {
    const presentPairs = new Set(presences.map((p) => `${p.apprenantId}:${p.seanceId}`));
    const seancesParGroupe = new Map<string, string[]>();
    for (const s of seancesPassees) {
      const list = seancesParGroupe.get(s.groupeId) ?? [];
      list.push(s.id);
      seancesParGroupe.set(s.groupeId, list);
    }

    const result = new Map<string, number | null>();
    for (const a of apprenants) {
      const seanceIds = seancesParGroupe.get(a.groupeId) ?? [];
      if (seanceIds.length === 0) {
        result.set(a.id, null);
        continue;
      }
      const present = seanceIds.filter((id) => presentPairs.has(`${a.id}:${id}`)).length;
      result.set(a.id, Math.round((1 - present / seanceIds.length) * 10000) / 100);
    }
    return result;
  }

  async getGroupes() {
    const { apprenants, notations } = await this.loadRaw();
    const scoresParApprenant = this.buildScoresParApprenant(notations);

    const parGroupe = new Map<string, { cle: string; label: string; moyennes: number[]; count: number }>();
    for (const a of apprenants) {
      const entry = parGroupe.get(a.groupe.cle) ?? {
        cle: a.groupe.cle,
        label: a.groupe.label,
        moyennes: [],
        count: 0,
      };
      entry.count += 1;
      const moyenne = this.moyenneGlobale(scoresParApprenant.get(a.id));
      if (moyenne !== null) entry.moyennes.push(moyenne);
      parGroupe.set(a.groupe.cle, entry);
    }

    return [...parGroupe.values()]
      .sort((a, b) => a.cle.localeCompare(b.cle))
      .map((g) => {
        const moyenne =
          g.moyennes.length > 0
            ? Math.round((g.moyennes.reduce((s, v) => s + v, 0) / g.moyennes.length) * 100) / 100
            : null;
        return { cle: g.cle, label: g.label, moyenne, statut: this.statutFor(moyenne), apprenantsCount: g.count };
      });
  }

  async getVivierC1() {
    const { apprenants, notations } = await this.loadRaw();
    const scoresParApprenant = this.buildScoresParApprenant(notations);

    const avecMoyenne = apprenants
      .map((a) => ({ apprenant: a, moyenne: this.moyenneGlobale(scoresParApprenant.get(a.id)) }))
      .filter((x): x is { apprenant: RawApprenant; moyenne: number } => x.moyenne !== null);

    const vivier = avecMoyenne
      .filter((x) => x.moyenne >= VIVIER_C1_THRESHOLD)
      .sort((a, b) => b.moyenne - a.moyenne)
      .map((x) => ({
        matricule: x.apprenant.matricule,
        prenom: x.apprenant.prenom,
        nom: x.apprenant.nom,
        groupeCle: x.apprenant.groupe.cle,
        moyenneGlobale: x.moyenne,
      }));

    // Taux calculé sur la cohorte entière (pas seulement les apprenants déjà
    // notés) — un apprenant pas encore noté compte comme "pas encore C1",
    // pas comme absent du calcul, pour rester lisible comme "% de la
    // cohorte" (même framing que l'ancien texte de TopBar).
    const globalRate = apprenants.length > 0 ? Math.round((vivier.length / apprenants.length) * 100) : 0;

    return { globalRate, apprenants: vivier };
  }

  // Taux de réussite PAR groupe — même seuil/logique que getVivierC1
  // (moyenneGlobale >= 75 à la séance la plus avancée entièrement notée),
  // mais agrégé groupe par groupe plutôt que sur la cohorte entière. Sert à
  // la vue "Vagues" du Portail RH (voir RhService.getVagues) : une vague
  // avec 0% n'a simplement pas encore d'apprenant noté à ce niveau, pas une
  // vague en échec.
  async getTauxReussiteParGroupe(): Promise<Map<string, number>> {
    const { apprenants, notations } = await this.loadRaw();
    const scoresParApprenant = this.buildScoresParApprenant(notations);

    const parGroupe = new Map<string, { total: number; reussis: number }>();
    for (const a of apprenants) {
      const entry = parGroupe.get(a.groupe.cle) ?? { total: 0, reussis: 0 };
      entry.total += 1;
      const moyenne = this.moyenneGlobale(scoresParApprenant.get(a.id));
      if (moyenne !== null && moyenne >= VIVIER_C1_THRESHOLD) entry.reussis += 1;
      parGroupe.set(a.groupe.cle, entry);
    }

    const result = new Map<string, number>();
    for (const [cle, { total, reussis }] of parGroupe) {
      result.set(cle, total > 0 ? Math.round((reussis / total) * 100) : 0);
    }
    return result;
  }

  async getGroupeDetail(cle: string) {
    const { apprenants: tousApprenants, notations, seancesPassees, presences } = await this.loadRaw();
    const apprenants = tousApprenants.filter((a) => a.groupe.cle === cle);
    if (apprenants.length === 0) {
      const exists = await this.prisma.groupe.findUnique({ where: { cle } });
      if (!exists) throw new NotFoundException(`Groupe ${cle} introuvable.`);
    }

    const scoresParApprenant = this.buildScoresParApprenant(notations);
    const tauxAbsenceParApprenant = this.buildTauxAbsence(tousApprenants, seancesPassees, presences);

    // Radar de compétences collectif : pour chaque compétence, moyenne à
    // travers les apprenants du groupe de leur dernière note connue pour
    // cette compétence (indépendamment par compétence, pas besoin que les 5
    // soient notées à la même séance — plus tolérant aux données partielles
    // que la "moyenne globale").
    const avgCompetencies = COMPETENCIES.map((key) => {
      const valeurs: number[] = [];
      for (const a of apprenants) {
        const bySeance = scoresParApprenant.get(a.id);
        if (!bySeance) continue;
        let latest: number | undefined;
        let latestNumero = -1;
        for (const [numero, scores] of bySeance) {
          if (scores[key] !== undefined && numero > latestNumero) {
            latestNumero = numero;
            latest = scores[key];
          }
        }
        if (latest !== undefined) valeurs.push(latest);
      }
      const score = valeurs.length > 0 ? Math.round(valeurs.reduce((s, v) => s + v, 0) / valeurs.length) : 0;
      return { key, score };
    });

    const tauxAbsences = apprenants
      .map((a) => tauxAbsenceParApprenant.get(a.id))
      .filter((v): v is number => v !== null && v !== undefined);
    const avgAbsence =
      tauxAbsences.length > 0
        ? Math.round(tauxAbsences.reduce((s, v) => s + v, 0) / tauxAbsences.length)
        : null;

    const apprenantsList = apprenants
      .map((a) => {
        const moyenne = this.moyenneGlobale(scoresParApprenant.get(a.id));
        const tauxAbsence = tauxAbsenceParApprenant.get(a.id) ?? null;
        return {
          matricule: a.matricule,
          prenom: a.prenom,
          nom: a.nom,
          moyenneGlobale: moyenne,
          tauxAbsence,
          alerteDecrochage: tauxAbsence !== null && tauxAbsence >= ALERTE_DECROCHAGE_TAUX_ABSENCE,
        };
      })
      .sort((a, b) => (b.moyenneGlobale ?? -1) - (a.moyenneGlobale ?? -1));

    const groupeMoyenne = (() => {
      const valeurs = apprenantsList
        .map((a) => a.moyenneGlobale)
        .filter((v): v is number => v !== null);
      return valeurs.length > 0 ? Math.round((valeurs.reduce((s, v) => s + v, 0) / valeurs.length) * 100) / 100 : null;
    })();

    return {
      cle,
      moyenne: groupeMoyenne,
      avgCompetencies,
      avgAbsence,
      apprenants: apprenantsList,
    };
  }

  // Courbe d'évolution des groupes — moyenne %, séances 1 à 4 (voir
  // EVOLUTION_SEANCES). Pour chaque groupe/séance, moyenne des apprenants
  // dont CETTE séance précise a ses 5 compétences notées (contrairement à
  // "moyenne globale" qui prend la séance la plus avancée disponible — ici
  // on veut le vrai point à ce moment précis, même si une séance plus
  // récente est aussi complète).
  async getEvolution() {
    const { apprenants, notations } = await this.loadRaw();
    const scoresParApprenant = this.buildScoresParApprenant(notations);

    const groupesCles = [...new Set(apprenants.map((a) => a.groupe.cle))].sort();
    const series = groupesCles.map((cle) => {
      const membres = apprenants.filter((a) => a.groupe.cle === cle);
      const points = EVOLUTION_SEANCES.map((numero) => {
        const valeurs: number[] = [];
        for (const a of membres) {
          const scores = scoresParApprenant.get(a.id)?.get(numero);
          if (scores && COMPETENCIES.every((c) => scores[c] !== undefined)) {
            valeurs.push(COMPETENCIES.reduce((s, c) => s + scores[c], 0));
          }
        }
        return valeurs.length > 0 ? Math.round(valeurs.reduce((s, v) => s + v, 0) / valeurs.length) : null;
      });
      return { cle, points };
    });

    return { seances: EVOLUTION_SEANCES, series };
  }

  async getRapportHebdo() {
    const { apprenants, notations, seancesPassees, presences } = await this.loadRaw();
    const scoresParApprenant = this.buildScoresParApprenant(notations);
    const tauxAbsenceParApprenant = this.buildTauxAbsence(apprenants, seancesPassees, presences);

    const moyennes = apprenants
      .map((a) => this.moyenneGlobale(scoresParApprenant.get(a.id)))
      .filter((v): v is number => v !== null);
    const moyenneGenerale =
      moyennes.length > 0 ? Math.round(moyennes.reduce((s, v) => s + v, 0) / moyennes.length) : null;

    const tauxAbsences = [...tauxAbsenceParApprenant.values()].filter((v): v is number => v !== null);
    const tauxPresenceGlobal =
      tauxAbsences.length > 0
        ? Math.round(100 - tauxAbsences.reduce((s, v) => s + v, 0) / tauxAbsences.length)
        : null;

    const seJourAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rendusCorriges7j = await this.prisma.notation.count({
      where: { fileKey: { not: null }, gradedAt: { gte: seJourAgo } },
    });

    const vivierC1Total = moyennes.filter((m) => m >= VIVIER_C1_THRESHOLD).length;
    const alertesDecrochageActuelles = [...tauxAbsenceParApprenant.values()].filter(
      (v): v is number => v !== null && v >= ALERTE_DECROCHAGE_TAUX_ABSENCE
    ).length;

    return {
      moyenneGenerale,
      tauxPresenceGlobal,
      rendusCorriges7j,
      vivierC1Total,
      alertesDecrochageActuelles,
    };
  }

  // Alertes Paiements & Casiers Apprenants — abonnement à date fixe
  // (décision produit 2026-08-24) : `Apprenant.abonnementExpireAt`, saisie/
  // mise à jour manuellement par le formateur (pas de facturation/webhook
  // automatique). "non_defini" pour les apprenants sans date encore fixée —
  // distinct de "en_retard", pour ne pas leur prêter un statut inventé.
  async getPaiements() {
    const apprenants = await this.prisma.apprenant.findMany({
      include: { groupe: true },
      orderBy: { abonnementExpireAt: "asc" },
    });
    return apprenants.map((a) => ({
      matricule: a.matricule,
      prenom: a.prenom,
      nom: a.nom,
      groupeCle: a.groupe.cle,
      abonnementExpireAt: a.abonnementExpireAt,
    }));
  }

  async setAbonnementExpireAt(matricule: string, expireAt: Date) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException(`Apprenant ${matricule} introuvable.`);
    const updated = await this.prisma.apprenant.update({
      where: { matricule },
      data: { abonnementExpireAt: expireAt },
      include: { groupe: true },
    });
    return {
      matricule: updated.matricule,
      prenom: updated.prenom,
      nom: updated.nom,
      groupeCle: updated.groupe.cle,
      abonnementExpireAt: updated.abonnementExpireAt,
    };
  }
}
