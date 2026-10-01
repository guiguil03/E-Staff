// Stockage S3-compatible pour les E2E (contrats PDF, CV, audio/vidéo
// d'évaluation — voir backend/src/common/storage.service.ts) — jamais le
// bucket Railway de dev/prod, un MinIO jetable comme la base Postgres (voir
// db-config.ts). MinIO expose la même API que le "Railway Bucket" utilisé en
// prod, donc rien à adapter côté code applicatif.
export const E2E_S3_ENDPOINT_URL = process.env.E2E_S3_ENDPOINT_URL ?? "http://localhost:9000";
export const E2E_S3_BUCKET = process.env.E2E_S3_BUCKET ?? "e-staf-e2e";
export const E2E_S3_ACCESS_KEY_ID = process.env.E2E_S3_ACCESS_KEY_ID ?? "minioadmin";
export const E2E_S3_SECRET_ACCESS_KEY = process.env.E2E_S3_SECRET_ACCESS_KEY ?? "minioadmin";
