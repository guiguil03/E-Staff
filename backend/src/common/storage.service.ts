import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import type { Readable } from "stream";

// Types de fichiers servis tels quels (audit du 2026-09-28). Le type
// enregistré vient souvent du navigateur de la personne qui dépose le
// fichier (file.mimetype) : un fichier déclaré text/html ou image/svg+xml
// serait affiché comme une page par le navigateur de celui qui l'ouvre, sur
// le domaine de l'API, avec sa session (XSS). Tout autre type est servi en
// téléchargement (application/octet-stream).
const TYPES_SURS = [
  /^application\/pdf$/,
  /^image\/(png|jpeg|gif|webp)$/,
  /^audio\/[\w.+-]+$/,
  /^video\/[\w.+-]+$/,
  /^text\/(plain|csv)$/,
  /^application\/(msword|rtf|zip|json)$/,
  /^application\/vnd\.(openxmlformats-officedocument\.[\w.]+|ms-[\w.]+|oasis\.opendocument\.[\w.]+)$/,
];

export function typeServable(contentType?: string): string {
  const base = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return TYPES_SURS.some((re) => re.test(base)) ? base : "application/octet-stream";
}

// Stockage objet (Railway Bucket, S3-compatible) pour les fichiers audio du
// module d'évaluation. Le disque du serveur Railway est éphémère (perdu à
// chaque redéploiement) — les enregistrements des candidats doivent donc
// vivre dans un stockage séparé du serveur, pas sur son système de fichiers.
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET_NAME ?? "";
    this.client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL,
      // Adressage "path-style" (host/bucket/clé) plutôt que "virtual-hosted"
      // (bucket.host/clé) — nécessaire dès qu'on parle à un endpoint
      // S3-compatible personnalisé plutôt qu'à AWS lui-même (le SDK envoie
      // du virtual-hosted par défaut, que le host ne résout pas). Découvert
      // en essayant de faire tourner les tests E2E contre un faux S3 local
      // (voir e2e/) — sans ça, tout upload échoue en "NoSuchBucket".
      forcePathStyle: true,
      region: process.env.AWS_DEFAULT_REGION ?? "auto",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async uploadBuffer(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  // Upload en flux depuis un fichier temporaire sur disque, plutôt qu'un
  // Buffer déjà entièrement chargé en RAM (audit scalabilité du 2026-10-08)
  // — pour les endpoints à grosse limite (vidéo, devoir, support de cours)
  // dont le `FileInterceptor` est passé en `diskStorage` : quelques dépôts
  // simultanés de 100-300 Mo en Buffer pouvaient épuiser la RAM du process.
  // `ContentLength` doit être fourni explicitement : un PUT S3 avec un
  // `Body` de type flux (pas un Buffer) sans longueur connue échoue.
  async uploadFile(key: string, filePath: string, contentType: string) {
    const { size } = await stat(filePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: contentType,
        ContentLength: size,
      })
    );
  }

  // Suppression d'un objet — purge RGPD (RhService.purgeCandidatData) et
  // suppression d'un support de cours par son formateur (SupportCoursService).
  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getObjectStream(
    key: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    return {
      stream: result.Body as Readable,
      contentType: typeServable(result.ContentType),
    };
  }
}
