// src/lib/api.js
import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};

  const base = browser
    ? "http://localhost:8000"   // no navegador → chama FastAPI direto
    : "http://localhost:8000";  // no SSR também

  const res = await fetch(base + url, options);

  if (!res.ok) {
    // opcional: logar ou lançar erro
    const text = await res.text().catch(() => "");
    console.error("apiFetch error", res.status, text);
    throw new Error(`Request failed: ${res.status}`);
  }

  // aqui já devolvemos JSON, como as telas esperam
  return res.json();
}
