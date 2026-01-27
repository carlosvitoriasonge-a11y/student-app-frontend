// src/lib/api.js
import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  let base = "http://127.0.0.1:8000"; // fallback seguro

  if (browser) {
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      base = "http://127.0.0.1:8000";        // rodando no Mac
    } else {
      base = "http://192.168.1.58:8000";     // rodando no servidor
    }
  }

  // Separa path e query params
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);

  // Normaliza só o path
  const normalizedPath = path.endsWith("/") ? path : path + "/";

  const full = normalizedPath + query;

  const res = await fetch(base + full, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
