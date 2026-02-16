// src/lib/api.js
import { goto } from "$app/navigation";

export async function apiFetch(url, options = {}, responseType = "json") {
  if (!options.headers) options.headers = {};

  const base = `http://${window.location.hostname}:8000`;



  // Token
  const token = localStorage.getItem("access_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // Se o body for FormData, NÃO definir Content-Type
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !options.headers["Content-Type"]) {
    options.headers["Content-Type"] = "application/json";
  }

  // Usa a URL como veio (sem inventar barra)
  const full = url;

  const res = await fetch(base + full, options);

  // Token expirado → volta para login
  if (res.status === 401) {
    localStorage.removeItem("access_token");
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
