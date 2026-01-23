<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";


  let graduates = [];
  let years = [];
  let selectedYear = "";
  let filteredGraduates = [];

  let loading = false;
  let error = "";

  // 復学用
  let selectedIds = [];
  let showDialog = false;

  // ★ 検索用
  let keyword = "";
  let searchResults = [];
  let searching = false;

  // ★ 性別フィルタ
  let filterMale = true;
  let filterFemale = true;

  // ★ コースフィルタ
  let course = "";

  // ★ パスワード保護
  let password = "";
  const RESTORE_PASSWORD = "1234";

  async function loadGraduates() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (course) params.append("course", course);

      const res = await apiFetch(
        `/api/students/graduates?${params.toString()}`
      );

      if (!res.ok) throw new Error("卒業生データの取得に失敗しました");

      graduates = await res.json();

      const yearSet = new Set(
        graduates
          .map(g => Number(g["卒業年度"]))
          .filter(y => !isNaN(y))
      );

      years = Array.from(yearSet).sort((a, b) => b - a);

    } catch (e) {
      error = String(e);
    }
    loading = false;
  }

  onMount(loadGraduates);

  $: if (course && !keyword) loadGraduates();

  $: filteredGraduates =
    keyword
      ? []
      : graduates.filter(g => {
          if (selectedYear && Number(g["卒業年度"]) !== Number(selectedYear)) {
            return false;
          }
          if (!filterMale && g.gender === "男") return false;
          if (!filterFemale && g.gender === "女") return false;
          if (course && g.course !== course) return false;
          return true;
        });

  async function search() {
    if (!keyword) {
      searchResults = [];
      return;
    }

    searching = true;

    const res = await apiFetch(
      `/api/students/graduates/search?keyword=${keyword}`
    );
    searchResults = await res.json();

    searching = false;
  }

  function openRestoreDialog() {
    if (selectedIds.length === 0) return;
    showDialog = true;
  }

  async function restoreStudents() {
    if (password !== RESTORE_PASSWORD) {
      alert("パスワードが違います");
      return;
    }

    try {
      const res = await apiFetch("/api/students/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore_ids: selectedIds })
      });

      if (!res.ok) throw new Error("復学処理に失敗しました");

      await loadGraduates();
      selectedIds = [];
      password = "";
      showDialog = false;

    } catch (e) {
      alert("エラー: " + e);
    }
  }
</script>

<h1>卒業生一覧</h1>

<div style="margin: 16px 0;">
  <input
    placeholder="名前・ふりがな・ID で検索"
    bind:value={keyword}
    on:input={search}
    style="padding: 6px; width: 250px;"
  />
</div>

{#if loading}
<p>読み込み中...</p>
{:else if error}
<p style="color: red;">{error}</p>
{:else}

{#if keyword && searchResults.length > 0}
<h3>検索結果</h3>

<table border="1" cellpadding="6">
  <thead>
    <tr>
      <th></th>
      <th>名前</th>
      <th>性別</th>
      <th>ID</th>
      <th>卒業年度</th>
      <th>最終学年</th>
    </tr>
  </thead>
  <tbody>
    {#each searchResults as g}
    <tr>
      <td><input type="checkbox" bind:group={selectedIds} value={g.id} /></td>
      <td><a href={"/students/graduates/" + g.id}>{g.name}</a></td>
      <td>{g.gender === "男" ? "男" : "女"}</td>
      <td>{g.id}</td>
      <td>{g["卒業年度"]}</td>
      <td>{g.grade}</td>
    </tr>
    {/each}
  </tbody>
</table>

{:else if keyword && searchResults.length === 0}
<p>該当する卒業生はいません。</p>

{:else}

<button on:click={openRestoreDialog} disabled={selectedIds.length === 0}>
  卒業取り消し
</button>

<div style="margin-top: 16px;">
  <label>
    コース：
    <select bind:value={course}>
      <option value="">全コース</option>
      <option value="全">全日</option>
      <option value="水">本科（水曜）</option>
      <option value="集">本科（集中）</option>
    </select>
  </label>
</div>

<div style="margin-bottom: 16px; margin-top: 10px;">
  <label>
    卒業年度：
    <select bind:value={selectedYear}>
      <option value="">全て表示</option>
      {#each years as y}
      <option value={y}>{y}年度</option>
      {/each}
    </select>
  </label>
</div>

<div style="margin: 10px 0;">
  <label><input type="checkbox" bind:checked={filterMale} />男子</label>
  <label style="margin-left: 10px;"><input type="checkbox" bind:checked={filterFemale} />女子</label>
</div>

<p>
  表示件数：{filteredGraduates.length} 名
  {#if selectedYear !== ""}（{selectedYear}年度）{/if}
</p>

<table border="1" cellpadding="6">
  <thead>
    <tr>
      <th></th>
      <th>名前</th>
      <th>性別</th>
      <th>ID</th>
      <th>卒業年度</th>
      <th>最終学年</th>
    </tr>
  </thead>
  <tbody>
    {#each filteredGraduates as g}
    <tr>
      <td><input type="checkbox" bind:group={selectedIds} value={g.id} /></td>
      <td><a href={"/students/graduates/" + g.id}>{g.name}</a></td>
      <td>{g.gender === "男" ? "男" : "女"}</td>
      <td>{g.id}</td>
      <td>{g["graduated_year"]}</td>
      <td>{g.grade}</td>
    </tr>
    {/each}
  </tbody>
</table>

{/if}
{/if}

{#if showDialog}
<div class="dialog-backdrop">
  <div class="dialog">
    <h3>卒業取り消し確認</h3>
    <p>以下の生徒の卒業を取り消しさせますか？</p>

    <ul>
      {#each graduates.filter(g => selectedIds.includes(g.id)) as g}
      <li>{g.name}（ID: {g.id}）</li>
      {/each}
    </ul>

    <label>
      パスワード：
      <input
        type="password"
        bind:value={password}
        style="width: 100%; margin-top: 6px;"
      />
    </label>

    <div style="margin-top: 12px;">
      <button on:click={restoreStudents}>OK</button>
      <button on:click={() => { showDialog = false; password = ""; }}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

<style>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog {
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 300px;
}
</style>
