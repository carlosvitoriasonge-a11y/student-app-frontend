import { writable } from "svelte/store";
import { browser } from "$app/environment";

let initial = 5;

if (browser) {
    const saved = localStorage.getItem("sessionTimeout");
    if (saved) initial = Number(saved);
}

export const sessionTimeout = writable(initial);

if (browser) {
    sessionTimeout.subscribe((value) => {
        localStorage.setItem("sessionTimeout", value);
    });
}
