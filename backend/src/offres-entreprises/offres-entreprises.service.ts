import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateLotDto,
  CreateMissionDto,
  UpdateLotDto,
  UpdateMissionDto,
} from "./dto/offres-entreprises.dto";

const PAR_ORDRE = [{ ordre: "asc" as const }, { createdAt: "asc" as const }];

// Slug ASCII (sans accents) pour le segment du formulaire d'inscription,
// ex. « Lot de 10 "Closers" » → « lot-de-10-closers ».
export function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

@Injectable()
export class OffresEntreprisesService {
  constructor(private readonly prisma: PrismaService) {}

  // Vitrine /entreprises : éléments publiés uniquement.
  async listPubliques() {
    const [lots, missions] = await Promise.all([
      this.prisma.lotEntreprise.findMany({ where: { publie: true }, orderBy: PAR_ORDRE }),
      this.prisma.missionEntreprise.findMany({ where: { publie: true }, orderBy: PAR_ORDRE }),
    ]);
    return {
      lots: lots.map(({ publie: _p, createdAt: _c, updatedAt: _u, ...l }) => l),
      missions: missions.map(({ publie: _p, createdAt: _c, updatedAt: _u, ...m }) => m),
    };
  }

  // ---- Lots ---------------------------------------------------------------

  listLots() {
    return this.prisma.lotEntreprise.findMany({ orderBy: PAR_ORDRE });
  }

  async createLot(dto: CreateLotDto) {
    const dernier = await this.prisma.lotEntreprise.aggregate({ _max: { ordre: true } });
    const segment = dto.segment ?? (await this.segmentLibreLot(`lot-${slugify(dto.nom)}`));
    return this.ecrire(() =>
      this.prisma.lotEntreprise.create({
        data: {
          ...dto,
          segment,
          dateFinFormation: new Date(dto.dateFinFormation),
          ordre: (dernier._max.ordre ?? -1) + 1,
        },
      })
    );
  }

  async updateLot(id: string, dto: UpdateLotDto) {
    await this.lotOuErreur(id);
    return this.ecrire(() =>
      this.prisma.lotEntreprise.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.dateFinFormation ? { dateFinFormation: new Date(dto.dateFinFormation) } : {}),
        },
      })
    );
  }

  async removeLot(id: string) {
    await this.lotOuErreur(id);
    await this.prisma.lotEntreprise.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Missions -----------------------------------------------------------

  listMissions() {
    return this.prisma.missionEntreprise.findMany({ orderBy: PAR_ORDRE });
  }

  async createMission(dto: CreateMissionDto) {
    const dernier = await this.prisma.missionEntreprise.aggregate({ _max: { ordre: true } });
    const segment = dto.segment ?? (await this.segmentLibreMission(`mission-${slugify(dto.titre)}`));
    return this.ecrire(() =>
      this.prisma.missionEntreprise.create({
        data: { ...dto, segment, ordre: (dernier._max.ordre ?? -1) + 1 },
      })
    );
  }

  async updateMission(id: string, dto: UpdateMissionDto) {
    await this.missionOuErreur(id);
    return this.ecrire(() => this.prisma.missionEntreprise.update({ where: { id }, data: dto }));
  }

  async removeMission(id: string) {
    await this.missionOuErreur(id);
    await this.prisma.missionEntreprise.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Internes -----------------------------------------------------------

  private async lotOuErreur(id: string) {
    const lot = await this.prisma.lotEntreprise.findUnique({ where: { id } });
    if (!lot) throw new NotFoundException("Lot introuvable.");
    return lot;
  }

  private async missionOuErreur(id: string) {
    const mission = await this.prisma.missionEntreprise.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException("Mission introuvable.");
    return mission;
  }

  // Segment dérivé du nom, suffixé -2, -3… s'il est déjà pris.
  private async segmentLibreLot(base: string) {
    let candidat = base;
    for (let i = 2; await this.prisma.lotEntreprise.findUnique({ where: { segment: candidat } }); i++) {
      candidat = `${base}-${i}`;
    }
    return candidat;
  }

  private async segmentLibreMission(base: string) {
    let candidat = base;
    for (let i = 2; await this.prisma.missionEntreprise.findUnique({ where: { segment: candidat } }); i++) {
      candidat = `${base}-${i}`;
    }
    return candidat;
  }

  // Segment déjà utilisé (contrainte unique) → 409 explicite plutôt qu'un 500.
  private async ecrire<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Ce segment est déjà utilisé par un autre élément.");
      }
      throw err;
    }
  }
}
