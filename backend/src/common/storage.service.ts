import { Injectable } from "@nestjs/common";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "stream";

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

  async getObjectStream(
    key: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    return {
      stream: result.Body as Readable,
      contentType: result.ContentType,
    };
  }
}
