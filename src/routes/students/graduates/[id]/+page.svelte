<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  let graduate = null;
  let loading = true;
  let error = "";

  let id;
  $: id = $page.params.id;

  onMount(async () => {
    try {
      const res = await fetch(`/api/students/graduates/${id}`);
      if (!res.ok) throw new Error("卒業生データの取得に失敗しました");

      graduate = await res.json();
    } catch (e) {
      error = String(e);
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

<div style="display: flex; gap: 20px;">

  <table border="1" cellpadding="6" style="width: 350px;">
    <tbody>
      <tr><th>名前</th><td>{graduate.name}</td></tr>
      <tr><th>ふりがな</th><td>{graduate.kana}</td></tr>
      <tr><th>性別</th><td>{genderLabel(graduate.gender)}</td></tr>
      <tr><th>学年</th><td>{graduate.grade}</td></tr>
      <tr><th>クラス</th><td>{graduate.class_name ?? ""}</td></tr>
      <tr><th>ID</th><td>{graduate.id}</td></tr>
      <tr><th>コース</th><td>{courseLabel(graduate.course)}</td></tr>

      <!-- ★ ここが修正ポイント ★ -->
      <tr><th>卒業年度</th><td>{graduate.graduated_year}</td></tr>

      <tr><th>電話番号</th><td>{graduate.phone || graduate.emergency1 || graduate.emergency2 || ""}</td></tr>
      <tr><th>住所</th><td>{(graduate.address1 ?? "") + " " + (graduate.address2 ?? "")}</td></tr>
      <tr><th>保護者</th><td>{graduate.guardian1 ?? ""}</td></tr>
      <tr><th>備考</th><td>{graduate.note1 ?? ""}</td></tr>
    </tbody>
  </table>

  <div>
    {#if graduate.photo}
      <img
        src={`/api/photos/${graduate.photo}`}
        alt="photo"
        style="width: 200px; border: 1px solid #ccc;"
      />
    {:else}
      <p>写真なし</p>
    {/if}
  </div>

</div>

{/if}
