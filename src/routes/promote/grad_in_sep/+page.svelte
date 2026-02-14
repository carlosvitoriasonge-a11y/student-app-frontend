<script>
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";
  
    let students = [];
    let filteredStudents = [];
    let graduate_ids = [];
  
    let loading = false;
    let totalGraduated = 0;
  
    let course = "";
  
    const courseLabels = {
      "": "全コース",
      "全": "全日",
      "水": "本科（水曜）",
      "集": "本科（集中）"
    };
  
    // -------------------------------
    // 生徒一覧取得
    // -------------------------------
    onMount(async () => {
      try {
        students = await apiFetch("/api/students/");
      } catch (e) {
        console.error("生徒一覧取得エラー:", e);
        students = [];
      }
    });
  
    // -------------------------------
    // フィルタリング（3年生のみ）
    // -------------------------------
    $: filteredStudents =
      students
        .filter(s => s.grade === "3")
        .filter(s => !course || s.course === course);
  
    $: graduate_ids = graduate_ids.filter(id =>
      filteredStudents.some(s => s.id === id)
    );
  
    function selectAll() {
      graduate_ids = filteredStudents.map(s => s.id);
    }
  
    function clearAll() {
      graduate_ids = [];
    }
  
    // -------------------------------
    // 9月卒業処理
    // -------------------------------
    async function runGraduateInSeptember() {
      if (!graduate_ids.length) return;
  
      let msg = "以下の内容で9月卒業処理を行います。\n\n";
      msg += `対象：3年生\n`;
      msg += `コース：${courseLabels[course]}\n\n`;
      msg += `卒業：${graduate_ids.length} 名\n`;
  
      if (!confirm(msg)) return;
  
      const password = prompt("管理者パスワードを入力してください");
      if (!password) return;
  
      loading = true;
  
      try {
        const data = await apiFetch("/api/graduate_sep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: "3",
            graduate_ids,
            password
          })
        });
  
        totalGraduated += data.graduated || 0;
  
        // remove from local list
        students = students.filter(s => !graduate_ids.includes(s.id));
        graduate_ids = [];
  
        alert("9月卒業処理が完了しました");
  
      } catch (e) {
        console.error("9月卒業エラー:", e);
        alert("処理に失敗しました");
      }
  
      loading = false;
    }
  </script>
  
  <h1>9月卒業処理（特別）</h1>
  
  <div style="margin-bottom:16px;">
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
  
  {#if filteredStudents.length === 0}
    <p>対象の3年生がいません。</p>
  {:else}
    <table border="1" cellpadding="6">
      <thead>
        <tr>
          <th>名前</th>
          <th>ID</th>
          <th>コース</th>
          <th>処理</th>
          <th>選択</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredStudents as s}
          <tr>
            <td>{s.name}</td>
            <td>{s.id}</td>
            <td>{courseLabels[s.course]}</td>
            <td>9月卒業</td>
            <td>
              <input type="checkbox" bind:group={graduate_ids} value={s.id} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  
    <div style="margin-top:10px;">
      <button on:click={clearAll} disabled={loading}>全解除</button>
      <button on:click={selectAll} disabled={loading}>全選択</button>
      <button on:click={runGraduateInSeptember} disabled={loading}>
        {loading ? "処理中..." : "9月卒業処理実行"}
      </button>
    </div>
  {/if}
  
  {#if totalGraduated > 0}
    <h2>処理完了</h2>
    <p>9月卒業：{totalGraduated} 名</p>
  {/if}
  