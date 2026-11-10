import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntrepriseProjetDto } from "./create-entreprise-projet.dto";

@Injectable()
export class EntreprisesProjetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEntrepriseProjetDto) {
    const { consent, ...rest } = dto;
    return this.prisma.entrepriseProjet.create({
      data: {
        ...rest,
        consentAt: new Date(),
      },
    });
  }

  list() {
    return this.prisma.entrepriseProjet.findMany({ orderBy: { createdAt: "desc" } });
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.entrepriseProjet.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Demande introuvable.");
    return this.prisma.entrepriseProjet.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    const existing = await this.prisma.entrepriseProjet.findUnique({
      where: { id },
      include: { _count: { select: { contratsB2B: true } } },
    });
    if (!existing) throw new NotFoundException("Demande introuvable.");
    if (existing._count.contratsB2B > 0) {
      throw new ConflictException(
        "Cette demande est rattachée à un contrat B2B : suppression impossible."
      );
    }
    await this.prisma.entrepriseProjet.delete({ where: { id } });
    return { ok: true };
  }

  // Entretien réservé via Cal.com (webhook BOOKING_*). Rapprochement par
  // e-mail : la demande la plus récente dont le contact figure parmi les
  // participants. Sans demande correspondante (réservation directe sur la
  // page Cal.com, autre adresse), on ignore — le webhook doit répondre 200
  // pour que Cal.com ne rejoue pas l'événement.
  async enregistrerReservationCal(evt: ReservationCal): Promise<{ matched: boolean }> {
    const emails = evt.emails.map((e) => e.trim().toLowerCase()).filter(Boolean);

    if (evt.type === "BOOKING_CANCELLED") {
      const cible =
        (await this.prisma.entrepriseProjet.findFirst({ where: { rdvCalUid: evt.uid } })) ??
        (await this.trouverParEmails(emails));
      if (!cible) return { matched: false };
      // Un uid différent = on annule un ancien créneau déjà remplacé.
      if (cible.rdvCalUid && cible.rdvCalUid !== evt.uid) return { matched: false };
      await this.prisma.entrepriseProjet.update({
        where: { id: cible.id },
        data: { rdvStatut: "annule" },
      });
      return { matched: true };
    }

    // BOOKING_CREATED / BOOKING_RESCHEDULED (nouvel uid, même contact).
    const cible = await this.trouverParEmails(emails);
    if (!cible) return { matched: false };
    await this.prisma.entrepriseProjet.update({
      where: { id: cible.id },
      data: {
        rdvDebut: evt.debut,
        rdvLien: evt.lien,
        rdvCalUid: evt.uid,
        rdvStatut: "confirme",
        // Un entretien planifié = premier contact établi.
        ...(cible.status === "nouveau" ? { status: "contacte" } : {}),
      },
    });
    return { matched: true };
  }

  private async trouverParEmails(emails: string[]) {
    if (emails.length === 0) return null;
    return this.prisma.entrepriseProjet.findFirst({
      where: { OR: emails.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })) },
      orderBy: { createdAt: "desc" },
    });
  }
}

export interface ReservationCal {
  type: "BOOKING_CREATED" | "BOOKING_RESCHEDULED" | "BOOKING_CANCELLED";
  uid: string;
  debut: Date;
  lien: string | null;
  emails: string[];
}
