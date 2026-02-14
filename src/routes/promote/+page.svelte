<script>
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import { goto } from "$app/navigation";


  let students = [];

  // 0: コース選択
  // 1: 3年生
  // 2: 2年生
  // 3: 1年生
  // 4: 完了
  let step = 0;

  let course = "";
  let promote_ids = [];
  let filteredStudents = [];

  let tableRef;
  let buttonX = 0;

  let loading = false;

  let totalPromoted = 0;
  let totalStayed = 0;
  let totalGraduated = 0;

  const courseLabels = {
    "": "全コース",
    "全": "全日",
    "水": "本科（水曜）",
    "集": "本科（集中）"
  };

  const stepTitles = {
    1: "3年生の卒業処理",
    2: "2年生の昇級処理",
    3: "1年生の昇級処理"
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

  function gradeForStep(step) {
    if (step === 1) return "3";
    if (step === 2) return "2";
    if (step === 3) return "1";
    return "";
  }

  // -------------------------------
  // フィルタリング
  // -------------------------------
  $: if (step >= 1 && step <= 3) {
    const g = gradeForStep(step);
    filteredStudents =
      g
        ? students
            .filter(s => s.grade === g)
            .filter(s => !course || s.course === course)
        : [];

    promote_ids = promote_ids.filter(id =>
      filteredStudents.some(s => s.id === id)
    );
  } else {
    filteredStudents = [];
    promote_ids = [];
  }

  $: if (tableRef) {
    const rect = tableRef.getBoundingClientRect();
    buttonX = rect.right;
  }

  function selectAll() {
    promote_ids = filteredStudents.map(s => s.id);
  }

  function clearAll() {
    promote_ids = [];
  }

  function startWizard() {
    if (!course) {
      if (!confirm("コース未選択です。\n全コース対象で開始しますか？")) return;
    }
    step = 1;
  }

  // -------------------------------
  // 昇級・卒業処理
  // -------------------------------
  async function runPromoteForCurrentStep() {
    const grade = gradeForStep(step);
    if (!grade) return;

    const unchecked = filteredStudents.filter(
      s => !promote_ids.includes(s.id)
    );

    let msg = "以下の内容で処理を行います。\n\n";
    msg += `対象学年：${grade} 年生\n`;
    msg += `コース：${courseLabels[course]}\n\n`;

    if (grade === "3") {
      msg += `卒業：${promote_ids.length} 名\n`;
      msg += `留年：${unchecked.length} 名\n\n`;
    } else {
      msg += `進級：${promote_ids.length} 名\n`;
      msg += `留年：${unchecked.length} 名\n\n`;
    }

    if (!confirm(msg)) return;

    const password = prompt("管理者パスワードを入力してください");
    if (!password) return;

    loading = true;

    try {
      const data = await apiFetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          promote_ids,
          password
        })
      });

      totalPromoted += data.promoted || 0;
      totalStayed += data.stayed || 0;
      totalGraduated += data.graduated || 0;

    } catch (e) {
      console.error("昇級処理エラー:", e);
      alert("処理に失敗しました");
    }

    loading = false;

    if (step < 3) {
      step += 1;
      promote_ids = [];
    } else {
      step = 4;
    }
  }
</script>

<h1>昇級処理</h1>

{#if step === 0}
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

  <button on:click={startWizard}>
    昇級処理を開始
  </button>

  <button on:click={() => goto('/promote/grad_in_sep')}>
    9月卒業処理へ（特別）
  </button>
{/if}

{#if step >= 1 && step <= 3}
  <h2>{stepTitles[step]}（{courseLabels[course]}）</h2>

  {#if filteredStudents.length === 0}
    <p>対象生徒がいません。</p>
    <button on:click={() => { step += 1; promote_ids = []; }}>
      {step < 3 ? "次へ" : "完了"}
    </button>
  {:else}
    <table bind:this={tableRef} border="1" cellpadding="6">
      <thead>
        <tr>
          <th>名前</th>
          <th>ID</th>
          <th>学年</th>
          <th>処理</th>
          <th>選択</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredStudents as s}
          <tr>
            <td>{s.name}</td>
            <td>{s.id}</td>
            <td>{s.grade}</td>
            <td>{s.grade === "3" ? "卒業" : "進級"}</td>
            <td>
              <input type="checkbox" bind:group={promote_ids} value={s.id} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div style="margin-top:10px;">
      <button on:click={clearAll} disabled={loading}>全解除</button>
      <button on:click={selectAll} disabled={loading}>全選択</button>
      <button on:click={runPromoteForCurrentStep} disabled={loading}>
        {loading ? "処理中..." : step === 1 ? "卒業処理実行" : "昇級処理実行"}
      </button>
    </div>
  {/if}
{/if}

{#if step === 4}
  <h2>昇級処理完了</h2>
  <p>
    卒業：{totalGraduated} 名 /
    進級：{totalPromoted} 名 /
    留年：{totalStayed} 名
  </p>
{/if}
