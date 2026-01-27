// src/lib/api.js
import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  // Em produção (navegador) → chama o backend do servidor
  // Em desenvolvimento (SSR local) → não usado com adapter-static
  const base = browser
    ? "http://192.168.1.58:8000"
    : "http://127.0.0.1:8000";

  const res = await fetch(base + url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
