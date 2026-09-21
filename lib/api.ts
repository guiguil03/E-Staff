// Retire un éventuel "/" final — évite un double slash si NEXT_PUBLIC_API_URL
// est renseigné avec (ex. "https://api.example.com/") ou sans.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

// `credentials: "include"` sur tous les appels : nécessaire pour que le
// navigateur envoie/reçoive le cookie de session httpOnly (voir
// backend/src/common/session.ts) alors que front et backend vivent sur des
// origines différentes (Next.js / NestJS, domaines distincts en
// production). Sans ça, le cookie posé par /auth/login ne serait jamais
// renvoyé aux appels suivants.
const CREDENTIALS: RequestCredentials = "include";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}

export async function apiDelete<T>(path: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: "DELETE", credentials: CREDENTIALS, headers });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}

export async function apiGet<T>(path: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: CREDENTIALS, headers });
  if (!res.ok) throw new ApiError("Une erreur est survenue.", res.status);
  return res.json();
}

export async function apiPostAuthed<T>(
  path: string,
  body: unknown,
  headers: HeadersInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}

export async function apiGetBlob(path: string, headers: HeadersInit): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, { credentials: CREDENTIALS, headers });
  if (!res.ok) throw new ApiError("Une erreur est survenue.", res.status);
  return res.blob();
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  headers?: HeadersInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: CREDENTIALS,
    headers,
    body: formData,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}
