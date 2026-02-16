<script>
  let username = "";
  let password = "";
  let error = "";

  const base = `http://${window.location.hostname}:8000`;

  async function login() {
    error = "";

    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      error = "無効なログイン";
      return;
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);

    window.location.href = "/home";
  }

  // ⭐ GOOGLE LOGIN
  const GOOGLE_CLIENT_ID =
    "404733269225-o1lmoqrgk3nnlkh6oedarn8eh9opvuiv.apps.googleusercontent.com";

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
</script>

<h1>ログイン</h1>

{#if error}
  <p style="color:red">{error}</p>
{/if}

<style>
  input {
    display: block;
    margin-bottom: 10px;
  }
</style>

<input placeholder="ユーザーID" bind:value={username} />
<input placeholder="パスワード" type="password" bind:value={password} />

<button on:click={login}>ログイン</button>

