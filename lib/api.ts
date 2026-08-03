const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}

export async function apiGet<T>(path: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers });
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
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError("Une erreur est survenue.", res.status);
  return res.blob();
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message ?? "Une erreur est survenue.", res.status);
  }
  return res.json();
}
