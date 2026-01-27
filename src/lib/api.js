// src/lib/api.js

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  // Lê a variável de ambiente correta para cada ambiente
  const base = import.meta.env.VITE_API_BASE;

  // Separa path e query params
  const qIndex = url.indexOf("?");
  const path = qIndex === -1 ? url : url.slice(0, qIndex);
  const query = qIndex === -1 ? "" : url.slice(qIndex);

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
