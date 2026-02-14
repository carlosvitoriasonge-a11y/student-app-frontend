<script>
    console.log("CALLBACK CARREGOU");

    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";

    onMount(async () => {
        console.log("ONMOUNT RODOU");

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        console.log("CODE:", code);

        if (!code) return;

        const res = await apiFetch(`/api/google/callback?code=${code}`);

        console.log("TOKEN RECEBIDO:", res);

        localStorage.setItem("google_access_token", res.google_access_token);

        window.location.href = "/";
    });
</script>

<p>Google に接続しています…</p>
