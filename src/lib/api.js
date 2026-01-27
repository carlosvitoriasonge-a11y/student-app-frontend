// src/lib/api.js
import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  const base = "http://127.0.0.1:8000";

  // Separa path e query params
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);

  // Normaliza só o path (sem tocar no query)
  const normalizedPath = path.endsWith("/") ? path : path + "/";

  // Monta a URL final SEM adicionar barra antes do ?
  const full = normalizedPath + query;

  const res = await fetch(base + full, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
