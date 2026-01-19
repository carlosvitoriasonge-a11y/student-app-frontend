<script>
  import { onMount } from "svelte";

  let students = [];

  // ウィザードステップ
  // 0: コース選択
  // 1: 3年生（卒業）
  // 2: 2年生（昇級）
  // 3: 1年生（昇級）
  // 4: 完了
  let step = 0;

  let course = "";
  let promote_ids = [];
  let filteredStudents = [];

  let tableRef;
  let buttonX = 0;

  let loading = false;

  // 累計結果
  let totalPromoted = 0;
  let totalStayed = 0;
  let totalGraduated = 0;

  const courseLabels = {
    full: "全日コース",
    wednesday: "本科（水曜）コース",
    intensive: "本科（集中）コース",
    "": "全コース"
  };

  const stepTitles = {
    1: "3年生の卒業処理",
    2: "2年生の昇級処理",
    3: "1年生の昇級処理"
  };

  // ★★★ ここが修正ポイント（末尾 / を追加）★★★
  onMount(async () => {
    const res = await fetch("http://localhost:8000/students/");
    students = await res.json();
  });

  // 現在ステップに対応する学年
  function gradeForStep(step) {
    if (step === 1) return "3";
    if (step === 2) return "2";
    if (step === 3) return "1";
    return "";
  }

  // 現在ステップに応じた一覧を更新
  $: if (step >= 1 && step <= 3) {
    const g = gradeForStep(step);
    filteredStudents =
      g && course !== undefined
        ? students
            .filter(s => s.grade === g)
            .filter(s => !course || s.course === course)
        : [];
    // 選択は表示中の生徒だけに限定
    promote_ids = promote_ids.filter(id =>
      filteredStudents.some(s => s.id === id)
    );
  } else {
    filteredStudents = [];
    promote_ids = [];
  }

  // テーブル右端の位置
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
      const ok = confirm(
        "コースが未選択です。\n全コースを対象にして昇級処理を開始しますか？"
      );
      if (!ok) return;
    }
    step = 1; // 3年生から開始
  }

  async function runPromoteForCurrentStep() {
    const grade = gradeForStep(step);
    if (!grade) return;

    const unchecked = filteredStudents.filter(
      s => !promote_ids.includes(s.id)
    );

    // 確認ダイアログ（3年は卒業、それ以外は昇級）
    let message = "以下の内容で処理を行います。\n\n";
    message += `対象学年：${grade} 年生\n`;
    message += `コース：${courseLabels[course]}\n\n`;

    if (grade === "3") {
      message += `卒業：${promote_ids.length} 名\n`;
      message += `留年：${unchecked.length} 名\n\n`;
    } else {
      message += `進級：${promote_ids.length} 名\n`;
      message += `留年：${unchecked.length} 名\n\n`;
    }

    message += "よろしいですか？";

    const ok = confirm(message);
    if (!ok) return;

    loading = true;

    const res = await fetch("http://localhost:8000/students/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade,
        promote_ids
      })
    });

    const data = await res.json();

    totalPromoted += data.promoted || 0;
    totalStayed += data.stayed || 0;
    totalGraduated += data.graduated || 0;

    loading = false;

    // 次のステップへ
    if (step < 3) {
      step += 1;
      promote_ids = [];
    } else {
      step = 4; // 完了
    }
  }
</script>

<h1>昇級処理</h1>

{#if step === 0}
  <!-- STEP 0: コース選択 -->
  <div style="margin-bottom: 16px;">
    <label>
      コースを選択：
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
{/if}

{#if step >= 1 && step <= 3}
  <!-- STEP 1〜3: 各学年ごとの処理 -->
  <h2>{stepTitles[step]}（{courseLabels[course]}）</h2>

  {#if filteredStudents.length === 0}
    <p>対象となる生徒がいません。</p>
    <button on:click={() => { step = step + 1; promote_ids = []; }}>
      {step < 3 ? '次へ' : '昇級処理を完了する'}
    </button>
  {:else}
    <table bind:this={tableRef} border="1" cellpadding="6" style="margin-bottom: 12px;">
      <thead>
        <tr>
          <th>名前</th>
          <th>ID</th>
          <th>学年</th>
          <th>処理内容</th>
          <th>チェック</th>
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

    <div
      style="
        position: absolute;
        left: {buttonX}px;
        transform: translateX(-100%);
        margin-top: 10px;
        display: flex;
        gap: 8px;
      "
    >
      <button on:click={clearAll} disabled={loading || filteredStudents.length === 0}>
        全て解除
      </button>

      <button on:click={selectAll} disabled={loading || filteredStudents.length === 0}>
        全てチェック
      </button>

      <button on:click={runPromoteForCurrentStep} disabled={loading || filteredStudents.length === 0}>
        {#if loading}
          処理中...
        {:else}
          {step === 1 ? '卒業処理を実行' : '昇級処理を実行'}
        {/if}
      </button>
    </div>
  {/if}
{/if}

{#if step === 4}
  <!-- STEP 4: 完了画面 -->
  <h2>昇級処理が完了しました</h2>
  <p style="font-weight: bold; color: green;">
    卒業: {totalGraduated} 名 / 進級: {totalPromoted} 名 / 留年: {totalStayed} 名
  </p>
{/if}
