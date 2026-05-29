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

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error ?? json.message ?? text;
  } catch {
    return text || `Request failed (${response.status})`;
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }

  if (!firebaseAuth.currentUser) {
    throw new ApiError(401, "Not authenticated");
  }

  const token = await withTimeout(
    firebaseAuth.currentUser.getIdToken(),
    REQUEST_TIMEOUT_MS,
    "getIdToken"
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers ?? {}),
  };

  const url = `${env.apiBaseUrl}${path}`;
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
    if (response.status === 401) {
      // Token was rejected server-side (revoked or expired) — sign out so the
      // user lands on the login screen rather than seeing a cryptic error.
      firebaseAuth.signOut().catch(() => {});
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
    const message = await parseErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  if (!env.apiBaseUrl) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  if (!firebaseAuth.currentUser) throw new ApiError(401, "Not authenticated");
  const token = await withTimeout(
    firebaseAuth.currentUser.getIdToken(),
    REQUEST_TIMEOUT_MS,
    "getIdToken"
  );
  const response = await withTimeout(
    fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }),
    REQUEST_TIMEOUT_MS,
    `${method} ${path}`
  );
  if (!response.ok) {
    if (response.status === 401) {
      firebaseAuth.signOut().catch(() => {});
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
    const message = await parseErrorMessage(response);
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}
