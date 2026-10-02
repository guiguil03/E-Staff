import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";
import { isImage, isVideo } from "../common/file-signature";
import { UpdateMediaPostDto } from "./dto/update-media-post.dto";

@Injectable()
export class MediaWallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async create(file: Express.Multer.File, caption?: string, auteur?: string, publiee = true) {
    const isPhoto = isImage(file.buffer);
    const isVid = !isPhoto && isVideo(file.buffer);
    if (!isPhoto && !isVid) {
      throw new BadRequestException("Le fichier ne semble pas être une image ou une vidéo valide.");
    }

    const extension = path.extname(file.originalname) || "";
    const key = `media-wall/${Date.now()}-${randomUUID()}${extension}`;
    await this.storage.uploadBuffer(key, file.buffer, file.mimetype || "application/octet-stream");

    return this.prisma.mediaPost.create({
      data: {
        type: isPhoto ? "photo" : "video",
        storageKey: key,
        mimeType: file.mimetype || "application/octet-stream",
        caption: caption?.trim() || null,
        auteur: auteur?.trim() || null,
        publiee,
      },
    });
  }

  async listPublic() {
    return this.prisma.mediaPost.findMany({
      where: { publiee: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listAdmin() {
    return this.prisma.mediaPost.findMany({ orderBy: { createdAt: "desc" } });
  }

  // Filtre `publiee: true` ici aussi (pas seulement dans listPublic) : sans
  // ça, "Masquer" depuis l'admin ne retirerait le post que de la liste JSON
  // — l'URL directe du fichier (déjà vue/mise en cache côté navigateur)
  // resterait accessible indéfiniment.
  async streamPublic(id: string) {
    const post = await this.prisma.mediaPost.findFirst({ where: { id, publiee: true } });
    if (!post) throw new NotFoundException("Média introuvable.");
    return this.storage.getObjectStream(post.storageKey);
  }

  async streamAdmin(id: string) {
    const post = await this.getOrThrow(id);
    return this.storage.getObjectStream(post.storageKey);
  }

  async update(id: string, dto: UpdateMediaPostDto) {
    await this.getOrThrow(id);
    return this.prisma.mediaPost.update({ where: { id }, data: dto });
  }

  // Likes/partages — aucune déduplication réelle possible sans compte
  // visiteur (voir commentaire du modèle MediaPost) : le compteur renvoyé
  // ici est la seule source de vérité, le client ne doit pas garder son
  // propre calcul optimiste indéfiniment pour éviter toute dérive entre
  // visiteurs simultanés.
  async like(id: string) {
    const post = await this.prisma.mediaPost.findFirst({ where: { id, publiee: true } });
    if (!post) throw new NotFoundException("Média introuvable.");
    return this.prisma.mediaPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });
  }

  async unlike(id: string) {
    const post = await this.prisma.mediaPost.findFirst({ where: { id, publiee: true } });
    if (!post) throw new NotFoundException("Média introuvable.");
    if (post.likes <= 0) return { likes: 0 };
    return this.prisma.mediaPost.update({
      where: { id },
      data: { likes: { decrement: 1 } },
      select: { likes: true },
    });
  }

  async share(id: string) {
    const post = await this.prisma.mediaPost.findFirst({ where: { id, publiee: true } });
    if (!post) throw new NotFoundException("Média introuvable.");
    return this.prisma.mediaPost.update({
      where: { id },
      data: { shares: { increment: 1 } },
      select: { shares: true },
    });
  }

  async remove(id: string) {
    const post = await this.getOrThrow(id);
    await this.storage.deleteObject(post.storageKey);
    return this.prisma.mediaPost.delete({ where: { id } });
  }

  private async getOrThrow(id: string) {
    const post = await this.prisma.mediaPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Média introuvable.");
    return post;
  }
}
