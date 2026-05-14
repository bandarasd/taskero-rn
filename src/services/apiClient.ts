import { env } from "./env";
import { firebaseAuth } from "./firebase";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const REQUEST_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function apiRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }

  const token = await withTimeout(
    firebaseAuth.currentUser?.getIdToken() ?? Promise.resolve(undefined),
    REQUEST_TIMEOUT_MS,
    "getIdToken"
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const url = `${env.apiBaseUrl}${path}`;
  console.log(`[api] ${options.method ?? "GET"} ${url} token=${!!token}`);
  const response = await withTimeout(
    fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
    REQUEST_TIMEOUT_MS,
    `${options.method ?? "GET"} ${path}`
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  if (!env.apiBaseUrl) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  const token = await withTimeout(
    firebaseAuth.currentUser?.getIdToken() ?? Promise.resolve(undefined),
    REQUEST_TIMEOUT_MS,
    "getIdToken"
  );
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await withTimeout(
    fetch(`${env.apiBaseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    }),
    REQUEST_TIMEOUT_MS,
    `POST ${path}`
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed (${response.status})`);
  }
  return (await response.json()) as T;
}
