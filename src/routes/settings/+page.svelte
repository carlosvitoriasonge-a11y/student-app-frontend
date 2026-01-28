<script>
  import { browser } from "$app/environment";

  let minutes = 15;

  if (browser) {
    const saved = localStorage.getItem("logout_minutes");
    if (saved) minutes = Number(saved);
  }

  function save() {
    if (browser) {
      localStorage.setItem("logout_minutes", minutes);
      alert("設定を保存しました");
    }
  }
</script>

<h1>自動ログアウト時間の設定</h1>

<label>ログアウトまでの時間（分）</label>
<input type="number" bind:value={minutes} min="1" max="120" />

<button on:click={save}>保存</button>
