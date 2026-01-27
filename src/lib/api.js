// src/lib/api.js
import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  // Detecta ambiente:
  // - Em desenvolvimento no Mac → localhost
  // - Em produção no servidor → 127.0.0.1
  const base = browser
    ? "http://localhost:8000"          // navegador no Mac
    : "http://127.0.0.1:8000";         // SSR no servidor

  const res = await fetch(base + url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
