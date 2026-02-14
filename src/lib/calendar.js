import { apiFetch } from "$lib/api";

export async function loadTodayEvents(googleToken) {
    try {
        const events = await apiFetch('/api/google/events', {
            headers: {
                "X-Google-Token": googleToken
            }
        });

        return events;
    } catch (err) {
        console.error("Erro ao carregar eventos do Google Calendar:", err);
        return [];
    }
}
