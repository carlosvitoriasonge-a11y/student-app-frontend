<script>
  import { onMount } from "svelte";

  let course = "";
  let grade = "";
  let classCount = 2;

  let students = [];
  let selected = [];

  let preview = null;
  let currentClassIndex = 1;

  // ★ 英語 → 日本語コース変換
  function toJpCourse(c) {
    if (c === "full") return "全";
    if (c === "wednesday") return "水";
    if (c === "intensive") return "集";
    return c;
  }

  // 生徒一覧取得
  async function loadStudents() {
    const res = await fetch(
      `/api/students/filter?grade=${grade}&course=${course}`
    );

    if (!res.ok) {
      alert("生徒一覧の取得に失敗しました");
      return;
    }

    students = await res.json();
  }

  // プレビュー
  async function doPreview() {
    const body = {
      grade,
      course: toJpCourse(course),   // ★ 日本語に変換
      class_name: `${currentClassIndex}組`,
      student_ids: selected
    };

    const res = await fetch("/api/classes/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "プレビューに失敗しました");
      return;
    }

    preview = await res.json();
  }

  // 登録
  async function commitClass() {
    const body = {
      class_name: `${currentClassIndex}組`,
      students: preview.students.map((s) => ({
        id: s.id,
        attend_no: s.attend_no
      }))
    };

    const res = await fetch("/api/classes/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "登録に失敗しました");
      return;
    }

    // 割り当て済みの生徒を一覧から除外
    students = students.filter((s) => !selected.includes(s.id));

    // 次のクラスへ
    currentClassIndex++;
    selected = [];
    preview = null;
  }
</script>

<h1>クラス分け</h1>

<label>
  コース：
  <select bind:value={course}>
    <option value="">選択</option>
    <option value="full">全日</option>
    <option value="wednesday">本科（水曜）</option>
    <option value="intensive">本科（集中）</option>
  </select>
</label>

<label>
  学年：
  <select bind:value={grade}>
    <option value="">選択</option>
    <option value="1">1年</option>
    <option value="2">2年</option>
    <option value="3">3年</option>
  </select>
</label>

{#if course === "full"}
  <label>
    クラス数：
    <select bind:value={classCount}>
      <option value="2">2クラス</option>
      <option value="3">3クラス</option>
      <option value="4">4クラス</option>
    </select>
  </label>
{/if}

<button on:click={loadStudents}>生徒一覧を読み込む</button>

{#if students.length > 0}
  <h2>生徒一覧</h2>

  <h3>{currentClassIndex}組の生徒を選択してください</h3>

  <table class="student-table">
    <thead>
      <tr>
        <th>選択</th>
        <th>氏名</th>
        <th>ふりがな</th>
        <th>性別</th>
        <th>ID</th>
      </tr>
    </thead>

    <tbody>
      {#each students as s (s.id)}
        <tr>
          <td>
            <input type="checkbox" value={s.id} bind:group={selected} />
          </td>
          <td>{s.name}</td>
          <td>{s.kana}</td>
          <td>{s.gender}</td>
          <td>{s.id}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <button on:click={doPreview}>プレビュー</button>
{/if}

{#if preview}
  <h2>{preview.class_name} のプレビュー</h2>

  <p>男子：{preview.male}</p>
  <p>女子：{preview.female}</p>
  <p>合計：{preview.total}</p>

  <table class="student-table">
    <thead>
      <tr>
        <th>出席番号</th>
        <th>氏名</th>
        <th>ふりがな</th>
        <th>性別</th>
        <th>ID</th>
      </tr>
    </thead>

    <tbody>
      {#each preview.students as s (s.id)}
        <tr>
          <td>{s.attend_no}</td>
          <td>{s.name}</td>
          <td>{s.kana}</td>
          <td>{s.gender}</td>
          <td>{s.id}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <button on:click={commitClass}>このクラスを登録</button>
{/if}

<style>
  .student-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .student-table th,
  .student-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  .student-table th {
    background: #f0f0f0;
  }

  .student-table tr:nth-child(even) {
    background: #fafafa;
  }
</style>
