import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../common/email.service";
import { DailyService } from "../classe-virtuelle/daily.service";
import {
  credentialsBox,
  emailParagraph,
  escapeHtml,
  renderEmailHtml,
} from "../common/email-template";
import { isoWeekToMonday } from "../common/paie-agent";
import {
  cartesRemuneration,
  isoWeekLabelUtc,
  type JourSuivi,
  niveauAlerte,
  SEUIL_FEU_VERT,
} from "../common/suivi-agent";
import { cartesSuperviseur, REUNIONS_MIN_PAR_SEMAINE } from "../common/suivi-superviseur";
import { ouvrirSalleVisio } from "../common/salle-visio";
import { ValiderJourneeDto } from "../agents/dto/valider-journee.dto";
import { AbsenceSuperviseurDto } from "./dto/absence-superviseur.dto";
import { EnvoyerMessageDto } from "./dto/envoyer-message.dto";
import { PlanifierReunionDto } from "./dto/planifier-reunion.dto";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function moisDe(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTemporaryPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join("");
}

// Cellule CSV (séparateur « ; » pour Excel FR) : guillemets doublés, et
// préfixe protecteur contre l'injection de formule (=, +, -, @).
function csv(valeur: string | number | null | undefined): string {
  let t = valeur === null || valeur === undefined ? "" : String(valeur);
  if (/^[=+\-@]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

// Espace Superviseur (2026-10-28) : le superviseur pilote les agents des
// missions dont il est le superviseur — statut en direct, validation des
// heures, alertes, messages, réunions, reporting client — et suit sa propre
// rémunération (voir common/suivi-superviseur.ts). Toutes les actions sont
// bornées à SON équipe : jamais un agent ou une journée qui n'est pas dans
// une de ses missions.
@Injectable()
export class SuperviseursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly daily: DailyService
  ) {}

  // ---- Chargement de l'équipe ----------------------------------------------

  private async chargerSuperviseur(matricule: string) {
    // Fenêtre de journées : le mois courant + la semaine ISO qui le précède
    // (la prime hebdo rattache une semaine au mois de son lundi).
    const debut = new Date();
    debut.setUTCHours(0, 0, 0, 0);
    debut.setUTCDate(1);
    debut.setUTCDate(debut.getUTCDate() - 7);

    const sup = await this.prisma.superviseur.findUnique({
      where: { matricule },
      include: {
        missions: {
          where: { dateFin: null, agentId: { not: null } },
          include: {
            agent: true,
            contrat: true,
            suivisJournaliers: { where: { jour: { gte: debut } }, orderBy: { jour: "asc" } },
          },
        },
      },
    });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    return sup;
  }

  private equipeDe(sup: Awaited<ReturnType<SuperviseursService["chargerSuperviseur"]>>) {
    return sup.missions
      .filter((m) => m.agent)
      .map((m) => ({ mission: m, agent: m.agent! }));
  }

  // ---- Tableau de bord ------------------------------------------------------

  // `contratId` : sélecteur d'équipe (une campagne/un client) — il restreint
  // les panneaux d'équipe ; la rémunération du superviseur, elle, porte
  // toujours sur l'ensemble de son équipe.
  async getDashboard(matricule: string, contratId?: string) {
    const sup = await this.chargerSuperviseur(matricule);
    const equipeComplete = this.equipeDe(sup);
    const equipe = contratId
      ? equipeComplete.filter((e) => e.mission.contratId === contratId)
      : equipeComplete;
    const now = new Date();
    const aujourdhui = new Date(now);
    aujourdhui.setUTCHours(0, 0, 0, 0);
    const periode = moisDe(aujourdhui);
    const semaine = isoWeekLabelUtc(aujourdhui);
    const agentIds = equipeComplete.map((e) => e.agent.id);

    const [alertes, reunions, messages, absences] = await Promise.all([
      this.prisma.alerteAgent.findMany({
        where: { agentId: { in: agentIds }, traiteeLe: null },
        include: { agent: true },
        orderBy: { creeeLe: "asc" },
      }),
      this.prisma.reunionSuperviseur.findMany({
        where: { superviseurId: sup.id, debut: { gte: new Date(now.getTime() - 3600_000) } },
        include: { participants: { include: { agent: true } } },
        orderBy: { debut: "asc" },
        take: 20,
      }),
      this.prisma.messageSuperviseur.findMany({
        where: { superviseurId: sup.id },
        include: { agent: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.absenceSuperviseur.findMany({ where: { superviseurId: sup.id } }),
    ]);

    const lundi = isoWeekToMonday(semaine);
    const lundiSuivant = new Date(lundi);
    lundiSuivant.setUTCDate(lundi.getUTCDate() + 7);
    const reunionsSemaine = await this.prisma.reunionSuperviseur.count({
      where: { superviseurId: sup.id, debut: { gte: lundi, lt: lundiSuivant } },
    });

    // Courbes de la semaine (lundi -> dimanche) : taux par jour, jamais de
    // valeur inventée pour un jour sans saisie.
    const indexJour = (d: Date) => Math.round((d.getTime() - lundi.getTime()) / 86400000);
    const courbeTaux = (releves: { jour: Date; tauxAtteint: number }[]) =>
      Array.from({ length: 7 }, (_, i) => releves.find((r) => indexJour(r.jour) === i)?.tauxAtteint ?? null);

    // Équipe : statut en direct et taux du mois de chaque agent.
    const lignesEquipe = equipe.map(({ agent, mission }) => {
      const duMois = mission.suivisJournaliers.filter((r) => moisDe(r.jour) === periode);
      const tauxMoyen =
        duMois.length > 0 ? round2(duMois.reduce((s, r) => s + r.tauxAtteint, 0) / duMois.length) : null;
      return {
        id: agent.id,
        matricule: agent.matricule,
        nom: `${agent.prenom} ${agent.nom}`,
        contratId: mission.contratId,
        courbeSemaine: courbeTaux(mission.suivisJournaliers),
        clientNom: mission.contrat.clientNom,
        statutPresence: agent.statutPresence,
        statutPresenceDepuis: agent.statutPresenceDepuis,
        tauxMoyenMois: tauxMoyen,
        alerte: tauxMoyen === null ? null : niveauAlerte(tauxMoyen),
        joursAValider: mission.suivisJournaliers.filter((r) => r.statutValidation !== "valide").length,
        alerteOuverte: alertes.some((a) => a.agentId === agent.id),
      };
    });

    const statuts: Record<string, number> = {
      en_ligne: 0,
      en_pause: 0,
      en_formation: 0,
      en_panne: 0,
      hors_ligne: 0,
    };
    for (const l of lignesEquipe) statuts[l.statutPresence] = (statuts[l.statutPresence] ?? 0) + 1;

    // Jauge globale du mois : taux moyen de toutes les journées saisies de
    // l'équipe rapporté au seuil de feu vert (même définition que la jauge
    // de l'agent).
    const tousTaux = equipe.flatMap(({ mission }) =>
      mission.suivisJournaliers.filter((r) => moisDe(r.jour) === periode).map((r) => r.tauxAtteint)
    );
    const tauxEquipe = tousTaux.length > 0 ? round2(tousTaux.reduce((a, b) => a + b, 0) / tousTaux.length) : null;

    const aValider = equipe
      .flatMap(({ agent, mission }) =>
        mission.suivisJournaliers
          .filter((r) => r.statutValidation !== "valide")
          .map((r) => ({
            id: r.id,
            jour: r.jour,
            agentNom: `${agent.prenom} ${agent.nom}`,
            clientNom: mission.contrat.clientNom,
            heuresTravaillees: r.heuresTravaillees,
            heuresPanne: r.heuresPanne,
            realise: r.realise,
            tauxAtteint: r.tauxAtteint,
            alerte: niveauAlerte(r.tauxAtteint),
            remarques: r.remarques,
            statutValidation: r.statutValidation,
          }))
      )
      .sort((a, b) => b.jour.getTime() - a.jour.getTime())
      .slice(0, 50);

    const joursDe = (r: {
      jour: Date;
      tauxAtteint: number;
      heuresTravaillees: number;
      heuresPanne: number;
      statutValidation: string;
    }): JourSuivi => ({
      jour: r.jour,
      tauxAtteint: r.tauxAtteint,
      heuresTravaillees: r.heuresTravaillees,
      heuresPanne: r.heuresPanne,
      statutValidation: r.statutValidation,
    });

    const jours: { agentId: string; jours: JourSuivi[] }[] = equipeComplete.map(({ agent, mission }) => ({
      agentId: agent.id,
      jours: mission.suivisJournaliers.map((r) => ({
        jour: r.jour,
        tauxAtteint: r.tauxAtteint,
        heuresTravaillees: r.heuresTravaillees,
        heuresPanne: r.heuresPanne,
        statutValidation: r.statutValidation,
      })),
    }));

    const clients = Array.from(
      new Map(equipeComplete.map((e) => [e.mission.contrat.id, e.mission.contrat.clientNom])).entries()
    ).map(([id, clientNom]) => ({ id, clientNom }));

    // Indicateurs du mois et courbe d'équipe de la semaine.
    const joursMois = equipe.flatMap(({ mission }) =>
      mission.suivisJournaliers.filter((r) => moisDe(r.jour) === periode)
    );
    const courbeEquipe = Array.from({ length: 7 }, (_, i) => {
      const duJour = equipe.flatMap(({ mission }) =>
        mission.suivisJournaliers.filter((r) => indexJour(r.jour) === i)
      );
      return {
        tauxMoyen:
          duJour.length > 0 ? round2(duJour.reduce((sum, r) => sum + r.tauxAtteint, 0) / duJour.length) : null,
        heures: round2(duJour.reduce((sum, r) => sum + r.heuresTravaillees, 0)),
        alerte:
          duJour.length > 0
            ? niveauAlerte(duJour.reduce((sum, r) => sum + r.tauxAtteint, 0) / duJour.length)
            : null,
      };
    });

    // Paie consolidée de l'équipe : mêmes règles que la carte de chaque
    // agent (cartesRemuneration), pour que le superviseur voie ce que
    // l'agent voit.
    const paieEquipe = equipe.map(({ agent, mission }) => {
      const c = cartesRemuneration({
        jours: mission.suivisJournaliers.map(joursDe),
        periode,
        salaireBase: agent.salaireBase,
        now,
      });
      return {
        agentId: agent.id,
        nom: `${agent.prenom} ${agent.nom}`,
        contratId: mission.contratId,
        base: c.salaire.base,
        retenues: c.pannes.retenues,
        semaines: c.primes.semaines.map((w) => ({ rang: w.rang, etat: w.etat, montant: w.montant })),
        primes: c.primes.total,
        net: c.net,
      };
    });

    // Suivi RH & compétences : dernier test rattaché à chaque agent.
    const candidatIds = equipe.map((e) => e.agent.candidatId).filter((x): x is string => Boolean(x));
    const tests = candidatIds.length
      ? await this.prisma.evaluationAttempt.findMany({
          where: { candidatId: { in: candidatIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const competences = equipe.map(({ agent }) => {
      const t = tests.find((x) => x.candidatId === agent.candidatId);
      return {
        agentId: agent.id,
        nom: `${agent.prenom} ${agent.nom}`,
        totalScore: t?.totalScore ?? null,
        niveau: t?.tier ?? null,
        parcours: t?.parcours ?? null,
      };
    });

    return {
      superviseur: { matricule: sup.matricule, prenom: sup.prenom, nom: sup.nom },
      periode,
      contratId: contratId ?? null,
      kpis: {
        volumeHeuresMois: round2(joursMois.reduce((sum, r) => sum + r.heuresTravaillees, 0)),
        tempsPanneMois: round2(joursMois.reduce((sum, r) => sum + r.heuresPanne, 0)),
        agentsOrange: lignesEquipe.filter((l) => l.alerte === "orange").length,
        agentsRouge: lignesEquipe.filter((l) => l.alerte === "rouge").length,
      },
      courbeEquipe,
      paieEquipe,
      competences,
      jaugeEquipe: {
        tauxMoyen: tauxEquipe,
        pourcentage:
          tauxEquipe === null ? null : Math.min(100, Math.round((tauxEquipe / SEUIL_FEU_VERT) * 100)),
        alerte: tauxEquipe === null ? null : niveauAlerte(tauxEquipe),
        agents: equipe.length,
      },
      statuts,
      equipe: lignesEquipe,
      aValider,
      alertes: alertes.map((a) => ({
        id: a.id,
        agentNom: `${a.agent.prenom} ${a.agent.nom}`,
        message: a.message,
        creeeLe: a.creeeLe,
      })),
      reunions: {
        aVenir: reunions.map((r) => ({
          id: r.id,
          titre: r.titre,
          debut: r.debut,
          dureeMin: r.dureeMin,
          type: r.type,
          participants: r.participants.map((p) => `${p.agent.prenom} ${p.agent.nom}`),
        })),
        cetteSemaine: reunionsSemaine,
        minParSemaine: REUNIONS_MIN_PAR_SEMAINE,
      },
      messages: messages.map((m) => ({
        id: m.id,
        texte: m.texte,
        createdAt: m.createdAt,
        destinataire: m.agent ? `${m.agent.prenom} ${m.agent.nom}` : "Toute l'équipe",
      })),
      clients,
      cartes: cartesSuperviseur({
        equipe: jours,
        absences: absences.map((a) => ({ jour: a.jour, heures: a.heures, justifiee: a.justifiee })),
        periode,
        now,
      }),
    };
  }

  // ---- Validation des heures ------------------------------------------------

  // La journée doit appartenir à une mission de CE superviseur.
  private async journeeDeMonEquipe(matricule: string, id: string) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const releve = await this.prisma.suiviAgentJournalier.findUnique({
      where: { id },
      include: { mission: true },
    });
    if (!releve) throw new NotFoundException("Relevé introuvable.");
    if (releve.mission.superviseurId !== sup.id) {
      throw new ForbiddenException("Cette journée n'appartient pas à votre équipe.");
    }
    return releve;
  }

  async validerJournee(matricule: string, id: string, dto: ValiderJourneeDto) {
    await this.journeeDeMonEquipe(matricule, id);
    return this.prisma.suiviAgentJournalier.update({
      where: { id },
      data: {
        statutValidation: "valide",
        valideLe: new Date(),
        commentaireSuperviseur: dto.commentaire?.trim() || null,
      },
    });
  }

  // « Renvoyer » : le superviseur demande à l'agent de corriger sa saisie,
  // avec un motif obligatoire. La journée reste modifiable par l'agent, qui
  // voit la demande ; à sa nouvelle saisie elle repasse « à valider ».
  async renvoyerJournee(matricule: string, id: string, dto: ValiderJourneeDto) {
    const motif = dto.commentaire?.trim();
    if (!motif) throw new BadRequestException("Indiquez ce que l'agent doit corriger.");
    await this.journeeDeMonEquipe(matricule, id);
    return this.prisma.suiviAgentJournalier.update({
      where: { id },
      data: { statutValidation: "a_corriger", valideLe: null, commentaireSuperviseur: motif },
    });
  }

  async rouvrirJournee(matricule: string, id: string) {
    await this.journeeDeMonEquipe(matricule, id);
    return this.prisma.suiviAgentJournalier.update({
      where: { id },
      data: { statutValidation: "a_valider", valideLe: null },
    });
  }

  // ---- Alertes ---------------------------------------------------------------

  async traiterAlerte(matricule: string, alerteId: string) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const alerte = await this.prisma.alerteAgent.findUnique({ where: { id: alerteId } });
    if (!alerte) throw new NotFoundException("Alerte introuvable.");
    const dansMonEquipe = await this.prisma.mission.findFirst({
      where: { superviseurId: sup.id, agentId: alerte.agentId, dateFin: null },
    });
    if (!dansMonEquipe) throw new ForbiddenException("Cet agent n'est pas dans votre équipe.");
    await this.prisma.alerteAgent.update({ where: { id: alerteId }, data: { traiteeLe: new Date() } });
    return { ok: true };
  }

  // ---- Messages ----------------------------------------------------------------

  private async agentIdsEquipe(supId: string): Promise<string[]> {
    const missions = await this.prisma.mission.findMany({
      where: { superviseurId: supId, dateFin: null, agentId: { not: null } },
      select: { agentId: true },
    });
    return missions.map((m) => m.agentId!);
  }

  async envoyerMessage(matricule: string, dto: EnvoyerMessageDto) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const equipe = await this.agentIdsEquipe(sup.id);
    if (dto.agentId && !equipe.includes(dto.agentId)) {
      throw new ForbiddenException("Cet agent n'est pas dans votre équipe.");
    }
    if (!dto.agentId && equipe.length === 0) {
      throw new BadRequestException("Vous n'avez aucun agent à qui diffuser ce message.");
    }
    return this.prisma.messageSuperviseur.create({
      data: { superviseurId: sup.id, agentId: dto.agentId ?? null, texte: dto.texte.trim() },
    });
  }

  // ---- Réunions ------------------------------------------------------------------

  async planifierReunion(matricule: string, dto: PlanifierReunionDto) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const debut = new Date(dto.debut);
    if (Number.isNaN(debut.getTime())) throw new BadRequestException("Date invalide.");
    if (debut.getTime() < Date.now() - 60_000) {
      throw new BadRequestException("La réunion doit être planifiée dans le futur.");
    }

    const equipe = await this.agentIdsEquipe(sup.id);
    const invites = dto.agentIds && dto.agentIds.length > 0 ? dto.agentIds : equipe;
    if (invites.length === 0) throw new BadRequestException("Aucun agent à inviter.");
    const etranger = invites.find((id) => !equipe.includes(id));
    if (etranger) throw new ForbiddenException("Un des agents invités n'est pas dans votre équipe.");

    const reunion = await this.prisma.reunionSuperviseur.create({
      data: {
        superviseurId: sup.id,
        titre: dto.titre.trim(),
        debut,
        dureeMin: dto.dureeMin,
        type: invites.length === 1 ? "individuelle" : "collective",
        participants: { create: invites.map((agentId) => ({ agentId })) },
      },
    });

    // Invitation par e-mail — au mieux : un échec d'envoi ne doit pas
    // empêcher la planification (l'agent la voit de toute façon dans son
    // espace).
    const agents = await this.prisma.agent.findMany({ where: { id: { in: invites } } });
    const quand = debut.toLocaleString("fr-FR", {
      timeZone: "Indian/Antananarivo",
      dateStyle: "full",
      timeStyle: "short",
    });
    await Promise.all(
      agents.map((a) =>
        this.email
          .send({
            to: a.email,
            subject: `Réunion planifiée — ${reunion.titre}`,
            text: `Bonjour ${a.prenom},\n\n${sup.prenom} ${sup.nom} a planifié « ${reunion.titre} » le ${quand} (${reunion.dureeMin} min).\n\nVous pourrez rejoindre la salle depuis votre Espace Agent.\n\nL'équipe e-Staf`,
            html: renderEmailHtml({
              title: "Réunion planifiée",
              preheader: reunion.titre,
              bodyHtml:
                emailParagraph(`Bonjour ${escapeHtml(a.prenom)},`) +
                emailParagraph(
                  `${escapeHtml(sup.prenom)} ${escapeHtml(sup.nom)} a planifié « ${escapeHtml(reunion.titre)} » le ${escapeHtml(quand)} (${reunion.dureeMin} min).`
                ) +
                emailParagraph("Vous pourrez rejoindre la salle depuis votre Espace Agent."),
            }),
          })
          .catch(() => null)
      )
    );
    return reunion;
  }

  async annulerReunion(matricule: string, id: string) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const reunion = await this.prisma.reunionSuperviseur.findUnique({ where: { id } });
    if (!reunion || reunion.superviseurId !== sup.id) throw new NotFoundException("Réunion introuvable.");
    if (reunion.roomName) await this.daily.deleteRoom(reunion.roomName);
    await this.prisma.reunionSuperviseur.delete({ where: { id } });
    return { ok: true };
  }

  async salleReunion(matricule: string, id: string) {
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const reunion = await this.prisma.reunionSuperviseur.findUnique({ where: { id } });
    if (!reunion || reunion.superviseurId !== sup.id) throw new NotFoundException("Réunion introuvable.");
    return ouvrirSalleVisio(
      this.daily,
      {
        roomId: `reunion-${reunion.id}`,
        roomName: reunion.roomName,
        roomUrl: reunion.roomUrl,
        dureeValiditeSecondes: 30 * 86400,
        persister: (roomName, roomUrl) =>
          this.prisma.reunionSuperviseur.update({ where: { id }, data: { roomName, roomUrl } }),
      },
      { userId: `sup-${sup.id}`, userName: `${sup.prenom} ${sup.nom}`, owner: true }
    );
  }

  // ---- Reporting client (CSV) --------------------------------------------------

  // Rapport d'activité d'un mois, exploitable par le client : une ligne par
  // agent et par journée VALIDÉE (jamais de chiffre non contrôlé), avec le
  // total par agent en fin de fichier.
  async rapportClientCsv(matricule: string, periode: string, contratId?: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periode)) throw new BadRequestException("Période invalide (AAAA-MM).");
    const sup = await this.prisma.superviseur.findUnique({ where: { matricule } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const [annee, mois] = periode.split("-").map(Number);
    const debut = new Date(Date.UTC(annee, mois - 1, 1));
    const fin = new Date(Date.UTC(annee, mois, 1));

    const missions = await this.prisma.mission.findMany({
      where: {
        superviseurId: sup.id,
        agentId: { not: null },
        ...(contratId ? { contratId } : {}),
      },
      include: {
        agent: true,
        contrat: true,
        suivisJournaliers: {
          where: { jour: { gte: debut, lt: fin }, statutValidation: "valide" },
          orderBy: { jour: "asc" },
        },
      },
    });
    if (contratId && missions.length === 0) throw new NotFoundException("Client introuvable dans votre équipe.");

    const lignes: string[] = [
      ["Client", "Agent", "Matricule", "Date", "Heures", "Panne (h)", "Ventes", "Objectif atteint (%)", "Commentaire"]
        .map(csv)
        .join(";"),
    ];
    const totaux: string[] = [];
    for (const m of missions) {
      let h = 0;
      let p = 0;
      let v = 0;
      for (const r of m.suivisJournaliers) {
        h += r.heuresTravaillees;
        p += r.heuresPanne;
        v += r.realise ?? 0;
        lignes.push(
          [
            m.contrat.clientNom,
            `${m.agent!.prenom} ${m.agent!.nom}`,
            m.agent!.matricule,
            r.jour.toISOString().slice(0, 10),
            r.heuresTravaillees,
            r.heuresPanne,
            r.realise ?? "",
            r.tauxAtteint,
            r.commentaireSuperviseur ?? "",
          ]
            .map(csv)
            .join(";")
        );
      }
      if (m.suivisJournaliers.length > 0) {
        totaux.push(
          [m.contrat.clientNom, `${m.agent!.prenom} ${m.agent!.nom}`, m.agent!.matricule, "TOTAL", round2(h), round2(p), v, "", ""]
            .map(csv)
            .join(";")
        );
      }
    }
    // BOM UTF-8 : Excel ouvre correctement les accents.
    return "﻿" + [...lignes, ...totaux].join("\r\n") + "\r\n";
  }

  // ---- Mon casier ------------------------------------------------------------------

  async getMonCasier(matricule: string) {
    const sup = await this.prisma.superviseur.findUnique({
      where: { matricule },
      include: {
        paiements: { orderBy: { periode: "desc" } },
        absences: { orderBy: { jour: "desc" } },
        performancesParClient: { include: { contrat: true }, orderBy: { periode: "desc" } },
        missions: { where: { dateFin: null, agentId: { not: null } }, include: { agent: true, contrat: true } },
      },
    });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");

    const parMois = new Map<string, { percu: number; enAttente: number }>();
    for (const p of sup.paiements) {
      const entry = parMois.get(p.periode) ?? { percu: 0, enAttente: 0 };
      if (p.statut === "paye") entry.percu = round2(entry.percu + p.montantFixe);
      else entry.enAttente = round2(entry.enAttente + p.montantFixe);
      parMois.set(p.periode, entry);
    }

    return {
      matricule: sup.matricule,
      prenom: sup.prenom,
      nom: sup.nom,
      email: sup.email,
      equipe: sup.missions.map((m) => ({
        agentNom: `${m.agent!.prenom} ${m.agent!.nom}`,
        matricule: m.agent!.matricule,
        clientNom: m.contrat.clientNom,
        role: m.role,
      })),
      remuneration: { fixe: sup.tarifFixe },
      paiements: {
        lignes: sup.paiements.map((p) => ({
          periode: p.periode,
          montantFixe: p.montantFixe,
          statut: p.statut,
          datePaiement: p.datePaiement,
        })),
        parMois: Array.from(parMois.entries())
          .map(([periode, v]) => ({ periode, ...v }))
          .sort((a, b) => (a.periode < b.periode ? 1 : -1)),
        totalPercu: round2(sup.paiements.filter((p) => p.statut === "paye").reduce((s, p) => s + p.montantFixe, 0)),
      },
      performances: sup.performancesParClient.map((p) => ({
        periode: p.periode,
        clientNom: p.contrat.clientNom,
        tauxPerformance: p.tauxPerformance,
        prime: p.prime,
      })),
      absences: sup.absences.map((a) => ({
        id: a.id,
        jour: a.jour,
        heures: a.heures,
        justifiee: a.justifiee,
        motif: a.motif,
      })),
    };
  }

  // ---- Comptes & absences (RH) ---------------------------------------------------

  async regenererIdentifiants(id: string) {
    const sup = await this.prisma.superviseur.findUnique({ where: { id }, include: { compte: true } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const motDePasse = generateTemporaryPassword();
    const nouveau = sup.compte === null;
    const donnees = {
      password: await bcrypt.hash(motDePasse, 10),
      resetToken: null,
      resetTokenExpiresAt: null,
      sessionsRevoqueesAt: new Date(),
    };
    await this.prisma.compteSuperviseur.upsert({
      where: { superviseurId: id },
      create: { superviseurId: id, ...donnees },
      update: donnees,
    });
    const intro = nouveau
      ? "Un compte superviseur a été créé pour vous sur e-Staf."
      : "Voici vos nouveaux identifiants pour votre Espace Superviseur.";
    const envoi = await this.email.send({
      to: sup.email,
      subject: nouveau ? "Bienvenue chez e-Staf — vos identifiants superviseur" : "Vos nouveaux identifiants e-Staf",
      text: `Bonjour ${sup.prenom},\n\n${intro}\n\nMatricule : ${sup.matricule}\nMot de passe temporaire : ${motDePasse}\n\nChangez ce mot de passe dès votre première connexion.\n\nL'équipe e-Staf`,
      html: renderEmailHtml({
        title: nouveau ? "Bienvenue chez e-Staf" : "Vos nouveaux identifiants",
        preheader: "Vos identifiants pour votre Espace Superviseur",
        bodyHtml:
          emailParagraph(`Bonjour ${escapeHtml(sup.prenom)},`) +
          emailParagraph(intro) +
          credentialsBox([
            { label: "Matricule", value: sup.matricule },
            { label: "Mot de passe temporaire", value: motDePasse },
          ]) +
          emailParagraph(
            "Vous y suivez votre équipe, validez les heures, planifiez vos réunions et consultez votre rémunération."
          ),
      }),
    });
    return { ok: true, emailEnvoye: envoi.delivered };
  }

  async listAbsences(id: string) {
    return this.prisma.absenceSuperviseur.findMany({ where: { superviseurId: id }, orderBy: { jour: "desc" } });
  }

  async ajouterAbsence(id: string, dto: AbsenceSuperviseurDto) {
    const sup = await this.prisma.superviseur.findUnique({ where: { id } });
    if (!sup) throw new NotFoundException("Superviseur introuvable.");
    const jour = new Date(dto.jour);
    if (Number.isNaN(jour.getTime())) throw new BadRequestException("Date invalide.");
    jour.setUTCHours(0, 0, 0, 0);
    return this.prisma.absenceSuperviseur.create({
      data: {
        superviseurId: id,
        jour,
        heures: dto.heures,
        justifiee: dto.justifiee,
        motif: dto.motif?.trim() || null,
      },
    });
  }

  async supprimerAbsence(absenceId: string) {
    const absence = await this.prisma.absenceSuperviseur.findUnique({ where: { id: absenceId } });
    if (!absence) throw new NotFoundException("Absence introuvable.");
    await this.prisma.absenceSuperviseur.delete({ where: { id: absenceId } });
    return { ok: true };
  }
}
