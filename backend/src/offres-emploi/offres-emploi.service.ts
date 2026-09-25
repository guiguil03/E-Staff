import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { OffreEmploi } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOffreEmploiDto, UpdateOffreEmploiDto } from "./dto/offre-emploi.dto";
import { calculerStatut } from "./statut";

// Ordre d'affichage : offres ouvertes d'abord, puis dernières places, puis
// clôturées — au sein de chaque statut, les plus récentes d'abord.
const ORDRE_STATUT = { ouvert: 0, presque_complet: 1, cloture: 2 } as const;

@Injectable()
export class OffresEmploiService {
  constructor(private readonly prisma: PrismaService) {}

  private avecStatut(offre: OffreEmploi, now: Date) {
    return { ...offre, ...calculerStatut(offre, now) };
  }

  private trier<T extends { statut: keyof typeof ORDRE_STATUT; createdAt: Date }>(offres: T[]): T[] {
    return offres.sort(
      (a, b) =>
        ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut] || b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Vitrine publique : offres publiées uniquement, sans les champs internes
  // (brouillon, compteur de candidatures).
  async listPubliques(now: Date = new Date()) {
    const offres = await this.prisma.offreEmploi.findMany({ where: { publiee: true } });
    return this.trier(offres.map((o) => this.avecStatut(o, now))).map(
      ({ publiee: _publiee, updatedAt: _updatedAt, ...publique }) => publique
    );
  }

  // Portail RH : toutes les offres (brouillons compris) + nombre de
  // candidatures reçues par offre.
  async listAll(now: Date = new Date()) {
    const offres = await this.prisma.offreEmploi.findMany({
      include: { _count: { select: { candidatures: true } } },
    });
    return this.trier(
      offres.map(({ _count, ...o }) => ({
        ...this.avecStatut(o, now),
        nbCandidatures: _count.candidatures,
      }))
    );
  }

  async create(dto: CreateOffreEmploiDto) {
    this.verifierPlaces(dto.placesTotal, dto.placesPourvues ?? 0);
    const offre = await this.prisma.offreEmploi.create({
      data: {
        ...dto,
        modalites: dto.modalites?.map((m) => m.trim()).filter(Boolean) ?? [],
        dateLimite: dto.dateLimite ? new Date(dto.dateLimite) : null,
        lienWhatsapp: dto.lienWhatsapp || null,
      },
    });
    return this.avecStatut(offre, new Date());
  }

  async update(id: string, dto: UpdateOffreEmploiDto) {
    const existante = await this.getOrThrow(id);
    this.verifierPlaces(
      dto.placesTotal ?? existante.placesTotal,
      dto.placesPourvues ?? existante.placesPourvues
    );
    const offre = await this.prisma.offreEmploi.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.modalites !== undefined
          ? { modalites: dto.modalites.map((m) => m.trim()).filter(Boolean) }
          : {}),
        ...(dto.dateLimite !== undefined
          ? { dateLimite: dto.dateLimite ? new Date(dto.dateLimite) : null }
          : {}),
        ...(dto.lienWhatsapp !== undefined ? { lienWhatsapp: dto.lienWhatsapp || null } : {}),
      },
    });
    return this.avecStatut(offre, new Date());
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    // Les candidatures déjà reçues sont conservées (offreEmploiId passe à
    // null, voir onDelete: SetNull dans schema.prisma).
    await this.prisma.offreEmploi.delete({ where: { id } });
    return { ok: true };
  }

  // Utilisé par RegistrationsService : une candidature ne peut viser qu'une
  // offre publiée, et une offre clôturée n'accepte plus que la liste
  // d'attente.
  async verifierCandidature(offreEmploiId: string, listeAttente: boolean) {
    const offre = await this.prisma.offreEmploi.findUnique({ where: { id: offreEmploiId } });
    if (!offre || !offre.publiee) throw new BadRequestException("Cette offre n'existe plus.");
    const { statut } = calculerStatut(offre);
    if (statut === "cloture" && !listeAttente) {
      throw new BadRequestException(
        "Cette offre est clôturée — vous pouvez rejoindre la liste d'attente."
      );
    }
    return offre;
  }

  private async getOrThrow(id: string) {
    const offre = await this.prisma.offreEmploi.findUnique({ where: { id } });
    if (!offre) throw new NotFoundException("Offre introuvable.");
    return offre;
  }

  private verifierPlaces(total: number, pourvues: number) {
    if (pourvues > total) {
      throw new BadRequestException("Les places pourvues ne peuvent pas dépasser le nombre total de places.");
    }
  }
}
