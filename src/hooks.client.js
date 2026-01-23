import { browser } from "$app/environment";

export const handleFetch = async ({ request, fetch }) => {
    if (browser) {
        const key = localStorage.getItem("appKey");
        if (key) {
            request.headers.set("X-APP-KEY", key);
        }
    }

    return fetch(request);
};
