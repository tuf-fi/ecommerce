const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const API_BASE_URL = BASE_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    // A FormData body needs the browser to set its own multipart Content-Type (with the boundary).
    headers: { ...(typeof FormData !== "undefined" && init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
