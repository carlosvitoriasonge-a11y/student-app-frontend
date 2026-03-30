<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { apiFetch } from "$lib/api";
  
    // -------------------------
    // FUNÇÕES DEVEM VIR ANTES DOS $:
    // -------------------------
  
    function normalizeClassName(c) {
      if (!c) return "999組";
      c = c.trim().replace(/\s+/g, "");
      c = c.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
      if (/^\d+$/.test(c)) return c + "組";
      if (/^\d+組$/.test(c)) return c;
      if (/^0\d+組$/.test(c)) return c.replace(/^0+/, "");
      if (!c.includes("組")) return c + "組";
      return c;
    }
  
    function sortByGradeClass(a, b) {
      const ga = Number(a.grade);
      const gb = Number(b.grade);
      if (ga !== gb) return ga - gb;
  
      const ca = normalizeClassName(a.class_name).replace("組", "");
      const cb = normalizeClassName(b.class_name).replace("組", "");
  
      const na = Number(ca);
      const nb = Number(cb);
  
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
  
      return ca.localeCompare(cb, "ja");
    }
  
    function displayStatus(status) {
      return status === "在籍" ? "在学" : status;
    }
  
    // -------------------------
    // VARIÁVEIS
    // -------------------------
  
    let students = [];
    let studentStats = {};
  
    let juniorHighList = [];
    let juniorHigh = "";
  
    let loading = false;
    let errorMessage = "";
    let showError = false;
  
    // -------------------------
    // 初回ロード
    // -------------------------
    onMount(() => {
      loadAll();
    });
  
    async function loadAll() {
      if (!browser) return;
  
      loading = true;
  
      try {
        let data = await apiFetch(`/api/students/all`);
        students = data;
  
        juniorHighList = [...new Set(data.map(s => s.junior_high).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, "ja"));
  
        const statsAll = await apiFetch("/api/attendance_stats/stats/all");
        studentStats = statsAll.student_stats;
  
      } catch (e) {
        console.error(e);
        errorMessage = "データの取得に失敗しました";
        showError = true;
      }
  
      loading = false;
    }
  
    // -------------------------
    // フィルター適用
    // -------------------------
    $: filteredStudents =
      juniorHigh === ""
        ? students
        : students.filter(s => s.junior_high === juniorHigh);
  
    // -------------------------
    // ⭐⭐ COLE O SORT AQUI ⭐⭐
    // -------------------------
    $: sortedStudents = [...filteredStudents]
      .sort((a, b) => {
        const r = sortByGradeClass(a, b);
        if (r !== 0) return r;
  
        const na = Number(String(a.attend_no).replace(/\D/g, ""));
        const nb = Number(String(b.attend_no).replace(/\D/g, ""));
        return na - nb;
      });
  
  </script>
  
  
  
  
  <h1>出身中学校別 出席簿</h1>
  
  <!-- 中学校選択 -->
  <label>
    出身中学校を選択：
    <select bind:value={juniorHigh}>
      <option value="">全ての中学校</option>
      {#each juniorHighList as j}
        <option value={j}>{j}</option>
      {/each}
    </select>
  </label>
  
  <br /><br />
  
  {#if loading}
    <p>読み込み中...</p>
  {:else if sortedStudents.length === 0}
    <p>該当する生徒がいません。</p>
  {:else}


  
  <div class="table-wrapper">
  <table class="students-table" border="1" cellpadding="6">
    <thead>
        <tr>
          <th rowspan="2" class="vertical-header">学年</th>
          <th rowspan="2" class="vertical-header">クラス</th>
          <th rowspan="2">名前</th>
          <th rowspan="2" class="vertical-header">在学状況</th>

      
          <th colspan="10" class="term-header">前期</th>
          <th colspan="10" class="term-header">後期</th>
          <th colspan="10" class="term-header">合計</th>
        </tr>
      
        <tr>
          <!-- 前期 -->
          <th class="vertical-header">授業日数</th>
          <th class="vertical-header">出席すべき日数</th>
          <th class="vertical-header">出席</th>
          <th class="vertical-header">欠席</th>
          <th class="vertical-header">遅刻</th>
          <th class="vertical-header">早退</th>
          <th class="vertical-header">忌引き</th>
          <th class="vertical-header">出停</th>
          <th class="vertical-header">公欠</th>
          <th class="vertical-header">出席率（％）</th>
      
          <!-- 後期 -->
          <th class="vertical-header">授業日数</th>
          <th class="vertical-header">出席すべき日数</th>
          <th class="vertical-header">出席</th>
          <th class="vertical-header">欠席</th>
          <th class="vertical-header">遅刻</th>
          <th class="vertical-header">早退</th>
          <th class="vertical-header">忌引き</th>
          <th class="vertical-header">出停</th>
          <th class="vertical-header">公欠</th>
          <th class="vertical-header">出席率（％）</th>
      
          <!-- 合計 -->
          <th class="vertical-header">授業日数</th>
          <th class="vertical-header">出席すべき日数</th>
          <th class="vertical-header">出席</th>
          <th class="vertical-header">欠席</th>
          <th class="vertical-header">遅刻</th>
          <th class="vertical-header">早退</th>
          <th class="vertical-header">忌引き</th>
          <th class="vertical-header">出停</th>
          <th class="vertical-header">公欠</th>
          <th class="vertical-header">出席率（％）</th>
        </tr>
      </thead>
      
  
      <tbody>


        {#each sortedStudents as s}
          <tr>
            <td>{s.grade}</td>
            <td>{s.class_name}</td>
            <td><a href={"/students/" + s.id}>{s.name}</a></td>
            <td>{displayStatus(s.status)}</td>


            <!-- 前期 -->
            <td>{studentStats?.[s.id]?.first_term?.school_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.required_attendance_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.attendance ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.absence ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.late ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.early ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.mourn ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.stopped ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.justified ?? 0}</td>
            <td>{studentStats?.[s.id]?.first_term?.attendance_rate ?? 0}</td>
      
            <!-- 後期 -->
            <td>{studentStats?.[s.id]?.second_term?.school_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.required_attendance_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.attendance ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.absence ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.late ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.early ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.mourn ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.stopped ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.justified ?? 0}</td>
            <td>{studentStats?.[s.id]?.second_term?.attendance_rate ?? 0}</td>
      
            <!-- 合計 -->
            <td>{studentStats?.[s.id]?.total?.school_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.required_attendance_days ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.attendance ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.absence ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.late ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.early ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.mourn ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.stopped ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.justified ?? 0}</td>
            <td>{studentStats?.[s.id]?.total?.attendance_rate ?? 0}</td>
          </tr>
        {/each}
      </tbody>
      
  </table>
  </div>
  
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
    .table-wrapper {
      overflow-x: auto;
      margin-top: 20px;
    }
  
    .students-table {
      border-collapse: collapse;
      min-width: 1600px;
    }
  
    .term-header {
      background: #f0f0f0;
      font-weight: bold;
    }
  
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.4);
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .vertical-header {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  padding: 4px 2px;
  font-size: 12px;
}

  </style>
  