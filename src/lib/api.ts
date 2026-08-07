export const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(apiUrl(path), init);
}
