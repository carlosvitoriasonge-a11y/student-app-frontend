<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";

  let graduates = [];
  let years = [];
  let selectedYear = "";

  let keyword = "";
  let searchResults = [];
  let searching = false;

  let filtered = [];

  let loading = false;
  let error = "";

  function extractYear(str) {
  if (!str) return null;
  const m = str.match(/^(\d{4})年度/);
  return m ? Number(m[1]) : null;
  }


  async function loadGraduates() {
    loading = true;
    try {
      graduates = await apiFetch("/api/students/graduates");

      const yearSet = new Set(
        graduates
          .map(g => extractYear(g.graduated_year))
          .filter(y => y !== null && !isNaN(y))
        );


      years = Array.from(yearSet).sort((a, b) => b - a);

      selectedYear = "";
      filtered = [];

    } catch (e) {
      console.error(e);
      error = "卒業生データの取得に失敗しました";
    }
    loading = false;
  }

  onMount(loadGraduates);

  function updateFiltered() {
    if (!selectedYear) {
      filtered = [];
      return;
    }

    filtered = graduates.filter(
      g => extractYear(g.graduated_year) === Number(selectedYear)
    );
  }

  async function search() {
    if (!keyword) {
      searchResults = [];
      return;
    }

    searching = true;

    searchResults = await apiFetch(
      `/api/students/graduates/search?keyword=${keyword}`
    );

    searching = false;
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
            <td><a href={"/students/graduates/" + g.id}>{g.name}</a></td>
            <td>{g.gender}</td>
            <td>{g.id}</td>
            <td>{g.graduated_year}</td>
            <td>{g.grade}</td>
          </tr>
        {/each}
      </tbody>
    </table>

  {:else if keyword && searchResults.length === 0}
    <p>該当する卒業生はいません。</p>

  {:else}

    <div style="margin-bottom: 16px;">
      <label>
        卒業年度：
        <select bind:value={selectedYear} on:change={updateFiltered}>
          <option value="">選択してください</option>
          {#each years as y}
            <option value={y}>{y}年度</option>
          {/each}
        </select>
      </label>
    </div>

    {#if selectedYear === ""}
      <p>卒業年度を選択してください。</p>
    {:else}
      <p>
        表示件数：{filtered.length} 名（{selectedYear}年度）
      </p>

      <table border="1" cellpadding="6">
        <thead>
          <tr>
            <th>名前</th>
            <th>性別</th>
            <th>ID</th>
            <th>卒業年度</th>
            <th>最終学年</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as g}
            <tr>
              <td><a href={"/students/graduates/" + g.id}>{g.name}</a></td>
              <td>{g.gender}</td>
              <td>{g.id}</td>
              <td>{g.graduated_year}</td>
              <td>{g.grade}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

  {/if}
{/if}

<style>
  table {
    border-collapse: collapse;
    margin-top: 16px;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 6px 10px;
    text-align: center;
  }
</style>
