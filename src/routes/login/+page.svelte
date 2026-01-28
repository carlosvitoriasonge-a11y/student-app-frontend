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