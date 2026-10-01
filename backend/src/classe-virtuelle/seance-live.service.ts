import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";

// Taille max de la scène du tableau blanc (éléments vectoriels, sans les
// images, stockées à part) — largement au-dessus d'un vrai cours.
const MAX_ELEMENTS_JSON_CHARS = 2_000_000;

// Outils du formateur pendant une classe virtuelle (demande cliente du
// 2026-09-25) : notes privées et tableau blanc partagé. Le tableau est
// synchronisé par versions : le formateur sauvegarde la scène, les
// apprenants la relisent seulement si la version a changé.
@Injectable()
export class SeanceLiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  // ---- Accès ----------------------------------------------------------------

  private async seanceDuFormateur(groupeCle: string, numero: number, formateurMatricule: string) {
    const [groupe, formateur] = await Promise.all([
      this.prisma.groupe.findUnique({ where: { cle: groupeCle } }),
      this.prisma.formateur.findUnique({ where: { matricule: formateurMatricule } }),
    ]);
    if (!groupe) throw new NotFoundException(`Groupe ${groupeCle} introuvable.`);
    if (!formateur || groupe.formateurId !== formateur.id) {
      throw new ForbiddenException(`Vous n'encadrez pas le groupe ${groupeCle}.`);
    }
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: groupe.id, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);
    return { seance, groupe };
  }

  private async seanceDeLApprenant(matricule: string, numero: number) {
    const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule } });
    if (!apprenant) throw new NotFoundException("Apprenant introuvable.");
    const seance = await this.prisma.seance.findUnique({
      where: { groupeId_numero: { groupeId: apprenant.groupeId, numero } },
    });
    if (!seance) throw new NotFoundException(`Séance n°${numero} introuvable.`);
    return seance;
  }

  // ---- Notes privées du formateur ------------------------------------------

  async getNotes(groupeCle: string, numero: number, formateurMatricule: string) {
    const { seance } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    const notes = await this.prisma.noteFormateur.findMany({
      where: { seanceId: seance.id },
      include: { apprenant: { select: { matricule: true } } },
    });
    const apprenants: Record<string, string> = {};
    let noteSeance = "";
    for (const n of notes) {
      if (n.apprenant) apprenants[n.apprenant.matricule] = n.contenu;
      else noteSeance = n.contenu;
    }
    return { seance: noteSeance, apprenants };
  }

  async saveNote(
    groupeCle: string,
    numero: number,
    formateurMatricule: string,
    contenu: string,
    apprenantMatricule?: string
  ) {
    const { seance, groupe } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    let apprenantId: string | null = null;
    if (apprenantMatricule) {
      const apprenant = await this.prisma.apprenant.findUnique({ where: { matricule: apprenantMatricule } });
      if (!apprenant || apprenant.groupeId !== groupe.id) {
        throw new BadRequestException("Cet apprenant n'appartient pas au groupe.");
      }
      apprenantId = apprenant.id;
    }
    // La contrainte unique (seanceId, apprenantId) ne s'applique pas à
    // apprenantId null en Postgres : la note de séance est retrouvée à la main.
    const existante = await this.prisma.noteFormateur.findFirst({ where: { seanceId: seance.id, apprenantId } });
    const note = existante
      ? await this.prisma.noteFormateur.update({ where: { id: existante.id }, data: { contenu } })
      : await this.prisma.noteFormateur.create({ data: { seanceId: seance.id, apprenantId, contenu } });
    return { contenu: note.contenu, updatedAt: note.updatedAt };
  }

  // ---- Tableau blanc ----------------------------------------------------------

  private async lireTableau(seanceId: string, depuisVersion?: number) {
    const tableau = await this.prisma.tableauBlanc.findUnique({
      where: { seanceId },
      include: { fichiers: { select: { fileId: true, mimeType: true } } },
    });
    if (!tableau) return { version: 0, elements: [], fichiers: [] };
    if (depuisVersion !== undefined && depuisVersion === tableau.version) {
      return { version: tableau.version, inchange: true as const };
    }
    return {
      version: tableau.version,
      elements: JSON.parse(tableau.elements) as unknown[],
      fichiers: tableau.fichiers,
    };
  }

  async getTableauFormateur(groupeCle: string, numero: number, formateurMatricule: string) {
    const { seance } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    return this.lireTableau(seance.id);
  }

  async saveTableau(groupeCle: string, numero: number, formateurMatricule: string, elements: unknown) {
    if (!Array.isArray(elements)) throw new BadRequestException("Scène invalide.");
    const json = JSON.stringify(elements);
    if (json.length > MAX_ELEMENTS_JSON_CHARS) {
      throw new BadRequestException("Tableau trop volumineux — effacez des éléments.");
    }
    const { seance } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    const tableau = await this.prisma.tableauBlanc.upsert({
      where: { seanceId: seance.id },
      create: { seanceId: seance.id, elements: json, version: 1 },
      update: { elements: json, version: { increment: 1 } },
    });
    return { version: tableau.version };
  }

  async uploadFichierTableau(
    groupeCle: string,
    numero: number,
    formateurMatricule: string,
    fileId: string,
    file: Express.Multer.File
  ) {
    if (!file) throw new BadRequestException("Image manquante ou trop volumineuse (5 Mo max).");
    if (!file.mimetype?.startsWith("image/")) {
      throw new BadRequestException("Seules les images peuvent être posées sur le tableau.");
    }
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(fileId)) throw new BadRequestException("Identifiant de fichier invalide.");
    const { seance } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    const storageKey = `tableaux/${seance.id}/${fileId}`;
    await this.storage.uploadBuffer(storageKey, file.buffer, file.mimetype);
    await this.prisma.tableauBlanc.upsert({
      where: { seanceId: seance.id },
      create: { seanceId: seance.id },
      update: {},
    });
    await this.prisma.tableauFichier.upsert({
      where: { seanceId_fileId: { seanceId: seance.id, fileId } },
      create: { seanceId: seance.id, fileId, storageKey, mimeType: file.mimetype },
      update: { storageKey, mimeType: file.mimetype },
    });
    return { fileId };
  }

  private async streamFichier(seanceId: string, fileId: string) {
    const fichier = await this.prisma.tableauFichier.findUnique({
      where: { seanceId_fileId: { seanceId, fileId } },
    });
    if (!fichier) throw new NotFoundException("Image introuvable.");
    const { stream } = await this.storage.getObjectStream(fichier.storageKey);
    return { stream, contentType: fichier.mimeType };
  }

  async getFichierFormateur(groupeCle: string, numero: number, formateurMatricule: string, fileId: string) {
    const { seance } = await this.seanceDuFormateur(groupeCle, numero, formateurMatricule);
    return this.streamFichier(seance.id, fileId);
  }

  // ---- Apprenant (lecture seule) --------------------------------------------

  async getTableauApprenant(matricule: string, numero: number, depuisVersion?: number) {
    const seance = await this.seanceDeLApprenant(matricule, numero);
    return this.lireTableau(seance.id, depuisVersion);
  }

  async getFichierApprenant(matricule: string, numero: number, fileId: string) {
    const seance = await this.seanceDeLApprenant(matricule, numero);
    return this.streamFichier(seance.id, fileId);
  }
}
