<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";

    let status = null;

    onMount(async () => {
        try {
            const res = await apiFetch("/api/system/status");
            status = await res.json();
        } catch (e) {
            console.error("Erro ao carregar status do servidor", e);
        }
    });

    function gb(bytes) {
        return (bytes / 1_000_000_000).toFixed(1);
    }
</script>

<style>
    .status-box {
        font-size: 0.8rem;
        opacity: 0.8;
        padding: 4px 8px;
        border-radius: 6px;
        background: #000000;
        margin-left: 10px;
    }
</style>

{#if status}
<div class="status-box">
    💾 {gb(status.disk_free)} GB 空き 
    •  
    🧠 {gb(status.mem_free)} GB RAM 空き
</div>
{/if}

