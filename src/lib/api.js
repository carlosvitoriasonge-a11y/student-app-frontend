// src/lib/api.js
import { goto } from "$app/navigation";

export async function apiFetch(url, options = {}, responseType = "json", isRetry = false) {
  if (!options.headers) options.headers = {};

  const base = `http://${window.location.hostname}:8000`;



  // Token
  const token = localStorage.getItem("access_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // Se o body for FormData, NÃO definir Content-Type
  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !options.headers["Content-Type"]) {
    options.headers["Content-Type"] = "application/json";
  }
  

  // Usa a URL como veio (sem inventar barra)
  const full = url;

  const res = await fetch(base + full, options);

  // Token expirado → tenta renovar com o refresh_token (1 vez)
  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken(base);
    if (refreshed) {
      return apiFetch(url, options, responseType, true);
    }
  }

  // Não renovou → volta para login
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    goto("/login");
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  // Tipos de retorno
  if (responseType === "blob") return res.blob();
  if (responseType === "text") return res.text();

  return res.json();
}

// Renova o access_token usando o refresh_token salvo no login
async function tryRefreshToken(base) {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return false;

  try {
    const res = await fetch(
      `${base}/auth/refresh?refresh_token=${encodeURIComponent(refresh)}`,
      { method: "POST" }
    );
    if (!res.ok) return false;

    const data = await res.json();
    if (!data.access_token) return false;

    localStorage.setItem("access_token", data.access_token);
    return true;
  } catch {
    return false;
  }
}
