const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token = localStorage.getItem("studybuddy-token")
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  if (response.status === 204) {
    return undefined as T;
  }

  const result: { data?: T; error?: string } = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? "Permintaan tidak berhasil.");
  }
  if (!("data" in result)) {
    throw new Error("Respons dari server tidak valid.");
  }
  return result.data as T;
}
