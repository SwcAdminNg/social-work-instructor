import { auth } from "@/auth";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const session = await auth();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";

  const headers = new Headers(options.headers);
  if (session && (session as any).accessToken) {
    headers.set("Authorization", `Bearer ${(session as any).accessToken}`);
  }
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  return res;
}

// Like fetchApi, but for endpoints that authenticate via a body param
// (e.g. a 2FA challenge_token) rather than the logged-in session.
export async function publicFetchApi(endpoint: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });
}
