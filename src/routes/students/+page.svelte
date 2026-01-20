<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  // -------------------------
  // エラーダイアログ
  // -------------------------
  let errorMessage = "";
  let showError = false;

  // -------------------------
  // フィルター項目
  // -------------------------
  let grade = "1";
  let course = "";
  let className = "";
  let classes = [];
  let students = [];
  let loading = false;

  // -------------------------
  // クラス一覧ロード
  // -------------------------
  async function loadClasses() {
    if (!browser) return; // ★ SSR防止

    const res = await fetch(`/api/students`);
    let data = await res.json();
    data = data.filter(s => s.grade === grade);

    classes = [...new Set(data.map(s => s.class_name).filter(Boolean))];
    className = "";
  }

  // -------------------------
  // 生徒一覧ロード
  // -------------------------
  async function load() {
    if (!browser) return;

    loading = true;

    const res = await fetch(`/api/students`);
    let data = await res.json();
    data = data.filter(s => s.grade === grade);

    // filtros no frontend
    if (course !== "") data = data.filter(s => s.course === course);
    if (className !== "") data = data.filter(s => s.class_name === className);

    students = data;
    loading = false;
  }




  // -------------------------
  // 検索
  // -------------------------
  let keyword = "";
  let searchResults = [];
  let searching = false;

  async function search() {
    if (!browser) return; // SSR防止

    const kw = keyword.trim();

    if (kw.length === 0) {
      searchResults = [];
      return;
    }

    searching = true;
    const res = await fetch(`/api/students/search?keyword=${kw}`);
    searchResults = await res.json();
    searching = false;
  }

  // -------------------------
  // 初回ロード（ブラウザのみ）
  // -------------------------
  onMount(() => {
    loadClasses();
    load();
  });

  // -------------------------
  // 学年変更時（★ SSR-safe）
  // -------------------------
  $: if (browser && grade !== "") loadClasses();

  // -------------------------
  // フィルター変更時（SSR-safe）
  // -------------------------
  $: if (browser && !showError && keyword.trim().length === 0) {
    grade;
    course;
    className;
    load();
  }

  // -------------------------
  // 性別フィルタ
  // -------------------------
  let filterMale = true;
  let filterFemale = true;

  $: filtered = students.filter((s) => {
    if (!filterMale && s.gender === "男") return false;
    if (!filterFemale && s.gender === "女") return false;
    return true;
  });
</script>

<h1>生徒一覧</h1>

<!-- コース選択 -->
<label>コースを選択：</label>
<select bind:value={course}>
  <option value="">全コース</option>
  <option value="全">全日</option>
  <option value="水">本科（水曜）</option>
  <option value="集">本科（集中）</option>
</select>

<br /><br />

<!-- 学年選択 -->
<label>
  学年を選択：
  <select bind:value={grade}>
    <option value="1">1年</option>
    <option value="2">2年</option>
    <option value="3">3年</option>
  </select>
</label>

<br /><br />

<!-- コース別ダウンロード -->
{#if grade}
  <div style="margin: 16px 0;">
    <p>コース別ダウンロード：</p>

    <button class="download-button" on:click={() => downloadClasslist("全")}>
      全日コース
    </button>

    <button
      class="download-button"
      on:click={() => downloadClasslist("水")}
      style="margin-left: 8px;"
    >
      水曜コース
    </button>

    <button
      class="download-button"
      on:click={() => downloadClasslist("集")}
      style="margin-left: 8px;"
    >
      集中コース
    </button>
  </div>
{/if}

<!-- クラス選択 -->
<label>
  クラスを選択：
  <select bind:value={className}>
    <option value="">全クラス</option>
    {#each classes as c}
      <option value={c}>{c}</option>
    {/each}
  </select>
</label>

<div style="margin: 10px 0;">
  <label>
    <input type="checkbox" bind:checked={filterMale} />
    男子
  </label>

  <label style="margin-left: 10px;">
    <input type="checkbox" bind:checked={filterFemale} />
    女子
  </label>
</div>

<div style="margin: 16px 0;">
  <input
    placeholder="名前・ふりがな・IDで検索"
    bind:value={keyword}
    on:input={search}
    style="padding: 6px; width: 250px;"
  />
</div>

<!-- 検索結果 -->
{#if keyword.trim().length > 0}
  {#if searching}
    <p>検索中...</p>
  {:else if searchResults.length > 0}
    <h3>検索結果</h3>

    <table border="1" cellpadding="6">
      <thead>
        <tr>
          <th>名前</th>
          <th>ふりがな</th>
          <th>性別</th>
          <th>学年</th>
          <th>クラス</th>
          <th>ID</th>
          <th>電話番号</th>
        </tr>
      </thead>

      <tbody>
        {#each searchResults as s}
          <tr>
            <td><a href={"/students/" + s.id}>{s.name}</a></td>
            <td>{s.kana}</td>
            <td>{s.gender}</td>
            <td>{s.grade}</td>
            <td>{s.class_name}</td>
            <td>{s.id}</td>
            <td>{s.phone || s.emergency1 || s.emergency2 || ""}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>該当する生徒はいません。</p>
  {/if}
{/if}

<!-- 通常一覧 -->
{#if keyword.trim().length === 0}
  {#if loading}
    <p>読み込み中...</p>
  {:else if students.length === 0}
    <p>データがありません。</p>
  {:else}
    <table border="1" cellpadding="6">
      <thead>
        <tr>
          <th>名前</th>
          <th>ふりがな</th>
          <th>性別</th>
          <th>学年</th>
          <th>クラス</th>
          <th>ID</th>
          <th>電話番号</th>
        </tr>
      </thead>

      <tbody>
        {#each filtered as s}
          <tr>
            <td><a href={"/students/" + s.id}>{s.name}</a></td>
            <td>{s.kana}</td>
            <td>{s.gender}</td>
            <td>{s.grade}</td>
            <td>{s.class_name}</td>
            <td>{s.id}</td>
            <td>{s.phone || s.emergency1 || s.emergency2 || ""}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

<!-- エラーダイアログ -->
{#if showError}
  <div class="modal-backdrop">
    <div class="modal">
      <p>{errorMessage}</p>
      <button on:click={() => (showError = false)}>閉じる</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .modal {
    background: white;
    padding: 20px 24px;
    border-radius: 8px;
    min-width: 260px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .modal button {
    margin-top: 12px;
    padding: 6px 16px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .modal button:hover {
    background: #1e40af;
  }
</style>
