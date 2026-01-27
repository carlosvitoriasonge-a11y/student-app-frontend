<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiFetch } from "$lib/api";

  let graduate = null;
  let loading = true;
  let error = "";

  let id;
  $: id = $page.params.id;

  onMount(async () => {
    try {
      graduate = await apiFetch(`/api/students/graduates/${id}`);
    } catch (e) {
      error = "卒業生データの取得に失敗しました";
      console.error(e);
    }
    loading = false;
  });

  function genderLabel(g) {
    return g === "male" ? "男" : g === "female" ? "女" : g;
  }

  function courseLabel(c) {
    return c === "full" ? "全"
         : c === "wednesday" ? "水"
         : c === "intensive" ? "集"
         : c;
  }
</script>

<h1>卒業生 詳細ページ</h1>

{#if loading}
  <p>読み込み中...</p>
{:else if error}
  <p style="color:red">{error}</p>
{:else if graduate}

<div class="container">

  <!-- LEFT SIDE -->
  <div class="left">
    <table class="info-table">
      <tbody>
        <tr><th>名前</th><td>{graduate.name}</td></tr>
        <tr><th>ふりがな</th><td>{graduate.kana}</td></tr>
        <tr><th>性別</th><td>{genderLabel(graduate.gender)}</td></tr>
        <tr><th>学年</th><td>{graduate.grade}</td></tr>
        <tr><th>クラス</th><td>{graduate.class_name ?? ""}</td></tr>
        <tr><th>ID</th><td>{graduate.id}</td></tr>
        <tr><th>コース</th><td>{courseLabel(graduate.course)}</td></tr>
        <tr><th>卒業年度</th><td>{graduate.graduated_year}</td></tr>
        <tr><th>電話番号</th><td>{graduate.phone || graduate.emergency1 || graduate.emergency2 || ""}</td></tr>
        <tr><th>住所</th><td>{(graduate.address1 ?? "") + " " + (graduate.address2 ?? "")}</td></tr>
        <tr><th>保護者</th><td>{graduate.guardian1 ?? ""}</td></tr>
        <tr><th>備考</th><td>{graduate.note1 ?? ""}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- RIGHT SIDE -->
  <div class="right">
    <div class="photo-box">
      {#if graduate.photo}
        <img
          src={`http://${window.location.hostname}/photos/${graduate.photo}`}
          alt="顔写真"
        />
      {:else}
        <div class="no-photo">写真なし</div>
      {/if}
    </div>

    <table class="info-table">
      <tbody>
        <tr><th>学生番号</th><td>{graduate.id}</td></tr>
        <tr><th>コース</th><td>{courseLabel(graduate.course)}</td></tr>
        <tr><th>学年</th><td>{graduate.grade}</td></tr>
        <tr><th>クラス</th><td>{graduate.class_name}</td></tr>
      </tbody>
    </table>
  </div>

</div>

{/if}

<style>
  .container { display: flex; gap: 40px; }
  .left, .right { width: 50%; }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1px solid #ccc;
  }

  .info-table th, .info-table td {
    border: 1px solid #ccc;
    padding: 6px 8px;
  }

  .info-table th {
    width: 180px;
    background: #f7f7f7;
    font-weight: bold;
  }

  .photo-box img {
    width: 200px;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }

  .no-photo {
    width: 200px;
    height: 200px;
    background: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    border: 1px solid #ccc;
  }
</style>
