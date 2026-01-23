import { browser } from "$app/environment";

export async function apiFetch(url, options = {}) {
    if (!options.headers) options.headers = {};

    if (browser) {
        const key = localStorage.getItem("appKey");
        if (key) {
            options.headers["X-APP-KEY"] = key;
        }
    }

    const res = await fetch(url, options);

    // 🔥 Intercepta 401 globalmente
    if (browser && res.status === 401) {
        localStorage.removeItem("appKey");
        window.location.href = "/login";
        return res; // nunca chega aqui, mas mantém a função consistente
    }

    return res;
}
