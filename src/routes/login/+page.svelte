<script>
    import { browser } from "$app/environment";
    import { apiFetch } from "$lib/api";

    let password = "";
    let error = "";

    async function login() {
        // testa a senha chamando o backend
        const res = await apiFetch("/api/system/status", {
            headers: {
                "X-APP-KEY": password
            }
        });

        if (res.status === 200) {
            if (browser) {
                localStorage.setItem("appKey", password);
                window.location.href = "/";
            }
        } else {
            error = "パスワードが正しくありません。";
        }
    }
</script>

<h1>ログイン</h1>

<input type="password" bind:value={password} placeholder="パスワード" />
<button on:click={login}>ログイン</button>

{#if error}
<p style="color:red">{error}</p>
{/if}
