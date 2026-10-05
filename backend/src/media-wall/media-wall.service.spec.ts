import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MediaWallService } from "./media-wall.service";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../common/storage.service";

function makePrismaMock() {
  return {
    mediaPost: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
const WEBM_SIGNATURE = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00]);
const BOGUS_BUFFER = Buffer.from("pas une image ni une vidéo");

function makeFile(buffer: Buffer, mimetype = "image/png"): Express.Multer.File {
  return {
    buffer,
    mimetype,
    originalname: "fichier.bin",
  } as Express.Multer.File;
}

describe("MediaWallService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let storage: { uploadBuffer: jest.Mock; deleteObject: jest.Mock; getObjectStream: jest.Mock };
  let service: MediaWallService;

  beforeEach(() => {
    prisma = makePrismaMock();
    storage = {
      uploadBuffer: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      getObjectStream: jest.fn().mockResolvedValue({ stream: "un-stream", contentType: "image/png" }),
    };
    service = new MediaWallService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService
    );
  });

  describe("create", () => {
    it("rejette un fichier qui n'est ni une image ni une vidéo valide", async () => {
      await expect(service.create(makeFile(BOGUS_BUFFER))).rejects.toThrow(BadRequestException);
      expect(storage.uploadBuffer).not.toHaveBeenCalled();
      expect(prisma.mediaPost.create).not.toHaveBeenCalled();
    });

    it("détecte une photo par son contenu réel, pas par le mimetype déclaré", async () => {
      prisma.mediaPost.create.mockResolvedValue({ id: "post-1" });
      await service.create(makeFile(PNG_SIGNATURE, "application/octet-stream"), "Une légende", "Fara");

      expect(storage.uploadBuffer).toHaveBeenCalledTimes(1);
      expect(prisma.mediaPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "photo",
          caption: "Une légende",
          auteur: "Fara",
          publiee: true,
        }),
      });
    });

    it("détecte une vidéo par son contenu réel", async () => {
      prisma.mediaPost.create.mockResolvedValue({ id: "post-2" });
      await service.create(makeFile(WEBM_SIGNATURE, "video/webm"));

      expect(prisma.mediaPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: "video" }),
      });
    });
  });

  describe("streamPublic", () => {
    it("lève NotFoundException si le post est masqué (publiee: false)", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue(null);
      await expect(service.streamPublic("post-1")).rejects.toThrow(NotFoundException);
      expect(storage.getObjectStream).not.toHaveBeenCalled();
    });

    it("stream le fichier si le post est publié", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue({ id: "post-1", storageKey: "media-wall/x.png" });
      await service.streamPublic("post-1");
      expect(storage.getObjectStream).toHaveBeenCalledWith("media-wall/x.png");
    });
  });

  describe("like / unlike / share", () => {
    it("incrémente likes et renvoie le nouveau total", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue({ id: "post-1", likes: 4 });
      prisma.mediaPost.update.mockResolvedValue({ likes: 5 });

      const result = await service.like("post-1");

      expect(prisma.mediaPost.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
      expect(result).toEqual({ likes: 5 });
    });

    it("rejette like si le post est masqué ou introuvable", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue(null);
      await expect(service.like("post-1")).rejects.toThrow(NotFoundException);
      expect(prisma.mediaPost.update).not.toHaveBeenCalled();
    });

    it("ne décrémente pas en dessous de 0", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue({ id: "post-1", likes: 0 });

      const result = await service.unlike("post-1");

      expect(result).toEqual({ likes: 0 });
      expect(prisma.mediaPost.update).not.toHaveBeenCalled();
    });

    it("décrémente normalement quand likes > 0", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue({ id: "post-1", likes: 2 });
      prisma.mediaPost.update.mockResolvedValue({ likes: 1 });

      const result = await service.unlike("post-1");

      expect(prisma.mediaPost.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      });
      expect(result).toEqual({ likes: 1 });
    });

    it("incrémente shares et renvoie le nouveau total", async () => {
      prisma.mediaPost.findFirst.mockResolvedValue({ id: "post-1", shares: 0 });
      prisma.mediaPost.update.mockResolvedValue({ shares: 1 });

      const result = await service.share("post-1");

      expect(prisma.mediaPost.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: { shares: { increment: 1 } },
        select: { shares: true },
      });
      expect(result).toEqual({ shares: 1 });
    });
  });

  describe("remove", () => {
    it("supprime le fichier du stockage avant la ligne en base", async () => {
      prisma.mediaPost.findUnique.mockResolvedValue({ id: "post-1", storageKey: "media-wall/x.png" });
      prisma.mediaPost.delete.mockResolvedValue({});

      await service.remove("post-1");

      expect(storage.deleteObject).toHaveBeenCalledWith("media-wall/x.png");
      expect(prisma.mediaPost.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    });

    it("lève NotFoundException si le post n'existe pas", async () => {
      prisma.mediaPost.findUnique.mockResolvedValue(null);
      await expect(service.remove("inconnu")).rejects.toThrow(NotFoundException);
      expect(storage.deleteObject).not.toHaveBeenCalled();
    });
  });
});
