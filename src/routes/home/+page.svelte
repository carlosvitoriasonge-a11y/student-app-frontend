<script>
    let today = new Date(); // usa o fuso do navegador automaticamente
    let month = today.getMonth() + 1; // 0 = janeiro, 8 = setembro

    import { onMount } from 'svelte';
    import { loadTodayEvents } from '$lib/calendar';

    let events = [];
    let googleToken = localStorage.getItem("google_access_token");

    // ⭐ FUNÇÃO DE LOGIN DO GOOGLE
    const GOOGLE_CLIENT_ID = "404733269225-o1lmoqrgk3nnlkh6oedarn8eh9opvuiv.apps.googleusercontent.com"; // <-- coloque o seu aqui

    function loginWithGoogle() {
    const redirect = import.meta.env.DEV
        ? "http://localhost:5173/google/callback"
        : "https://student-app-frontend.pages.dev/google/callback";

    const url =
        "https://accounts.google.com/o/oauth2/v2/auth" +
        `?client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${redirect}` +
        "&response_type=code" +
        "&scope=https://www.googleapis.com/auth/calendar.readonly" +
        "&access_type=offline" +
        "&prompt=consent";

    window.location.href = url;
}

    onMount(async () => {
        googleToken = localStorage.getItem("google_access_token");

        if (!googleToken) return;

        events = await loadTodayEvents(googleToken);
    });
</script>
  

<h1>学生管理システム</h1>

<p>英心高校学生管理システムへようこそ。左側のメニューから操作を選択してください。</p>
<p>☆使用後は必ずログアウトをしてください。☆</p>

{#if month === 9}
  <p style="color:red; font-weight:bold; margin-top:20px;">
    ☆教務の先生へ：　今年は9月卒業の生徒がいれば、９月中に卒業処理をしてください。☆
  </p>
{/if}

<!-- ⭐ AQUI: BLOCO DO GOOGLE CALENDAR -->
<div style="margin-top: 25px;">
    <h2>今日の予定</h2>

    {#if !googleToken}
        <p style="color: gray;">Google にログインすると予定が表示されます。</p>

        <!-- ⭐ BOTÃO DE LOGIN DO GOOGLE -->
        <button on:click={loginWithGoogle}
            style="margin-top: 10px; padding: 8px 14px; cursor: pointer;">
            Google にログイン
        </button>

    {:else if events.length === 0}
        <p>今日は予定がありません。</p>

    {:else}
        <ul>
            {#each events as event}
                <li style="margin-bottom: 10px;">
                    <strong>{event.summary}</strong><br>
                    {new Date(event.start).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                    〜
                    {new Date(event.end).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </li>
            {/each}
        </ul>
    {/if}
</div>
