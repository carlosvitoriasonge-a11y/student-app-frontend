<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiFetch } from "$lib/api";

  let student = null;
  let loading = true;
  let error = "";

  let id;
  $: id = $page.params.id;

  // ====== COURSE CHANGE ======
  let showCourseModal = false;
  let newCourse = "";
  let changing = false;
  let changeError = "";

  // ====== PASSWORD MODAL ======
  let showPasswordModal = false;
  let adminPassword = "";
  let passwordError = "";

  // ====== JOSEKI MODAL ======
  let showJoseki = false;
  let josekiDate = "";
  let josekiPassword = "";

  async function submitJoseki() {
    if (!josekiDate || !josekiPassword) {
      alert("日付とパスワードを入力してください");
      return;
    }

    try {
      await apiFetch("/api/students/joseki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          date: josekiDate,
          password: josekiPassword
        })
      });

      alert("除籍しました");
      window.location.href = "/students";

    } catch (e) {
      alert("除籍に失敗しました");
    }
  }

  // ====== TENGAKU ======
  let showTengaku = false;
  let tengakuDate = "";
  let tengakuSchool = "";
  let tengakuPassword = "";

  async function submitTengaku() {
    if (!tengakuDate || !tengakuSchool || !tengakuPassword) {
      alert("日付・転学先・パスワードを入力してください");
      return;
    }

    try {
      await apiFetch("/api/students/tengaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          date: tengakuDate,
          destination_school: tengakuSchool,
          password: tengakuPassword
        })
      });

      alert("転学処理が完了しました");
      window.location.href = "/students";

    } catch (e) {
      alert("転学に失敗しました");
    }
  }

  // ====== TAIGAKU ======
  let showTaigaku = false;
  let taigakuDate = "";
  let taigakuPassword = "";

  async function submitTaigaku() {
    if (!taigakuDate || !taigakuPassword) {
      alert("日付とパスワードを入力してください");
      return;
    }

    try {
      await apiFetch("/api/students/taigaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          date: taigakuDate,
          password: taigakuPassword
        })
      });

      alert("退学処理が完了しました");
      window.location.href = "/students";

    } catch (e) {
      alert("退学に失敗しました");
    }
  }

  function openCourseModal() {
    newCourse = student.course;
    changeError = "";
    showCourseModal = true;
  }

  async function changeCourse(password) {
    if (newCourse === student.course) {
      showCourseModal = false;
      return;
    }

    changing = true;
    changeError = "";

    try {
      const result = await apiFetch("/api/students/change_course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          new_course: newCourse,
          password
        })
      });

      student.course = result.course;
      student.class_name = result.class_name;
      student.attend_no = result.attend_no;

      showCourseModal = false;

    } catch (e) {
      changeError = "コース変更に失敗しました";
    } finally {
      changing = false;
    }
  }

  function confirmPasswordAndChange() {
    if (!adminPassword) {
      passwordError = "パスワードを入力してください";
      return;
    }

    passwordError = "";
    showPasswordModal = false;
    changeCourse(adminPassword);
    adminPassword = "";
  }

  function toWareki(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (y >= 2019) return `令和${y - 2018}年 ${m}月${day}日`;
    if (y >= 1989) return `平成${y - 1988}年 ${m}月${day}日`;
    if (y >= 1926) return `昭和${y - 1925}年 ${m}月${day}日`;
    return `${y}年 ${m}月${day}日`;
  }

  onMount(async () => {
    try {
      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });
    } catch (e) {
      error = "生徒データの取得に失敗しました";
    }
    loading = false;
  });
</script>

<h1>生徒詳細</h1>

{#if loading}
  <p>読み込み中...</p>
{:else if error}
  <p style="color:red">{error}</p>
{:else if student}

<div class="container">
  <div class="left">
    <table class="info-table">
      <tbody>
        <tr><th>生徒氏名</th><td>{student.name}</td></tr>
        <tr><th>ふりがな</th><td>{student.kana}</td></tr>
        <tr><th>性別</th><td>{student.gender}</td></tr>
        <tr><th>生年月日</th><td>{student.birth_date}（{toWareki(student.birth_date)}）</td></tr>
        <tr><th>郵便番号</th><td>{student.postal_code}</td></tr>
        <tr><th>住所①</th><td>{student.address1}</td></tr>
        <tr><th>住所②</th><td>{student.address2}</td></tr>
        <tr><th>出身中学</th><td>{student.junior_high}</td></tr>
        <tr><th>中学校卒業年度</th><td>{student.junior_high_grad_date}（{toWareki(student.junior_high_grad_date)}）</td></tr>
        <tr><th>入学年度</th><td>{student.admission_date}（{toWareki(student.admission_date)}）</td></tr>
        <tr><th>通学方法</th><td>{student.commute}</td></tr>
        <tr><th>担任</th><td>{student.hr_teacher}</td></tr>
        <tr><th>保護者氏名</th><td>{student.guardian1}</td></tr>
        <tr><th>保護者ふりがな</th><td>{student.guardian1_kana}</td></tr>
        <tr><th>保護者住所</th><td>{student.guardian_address}</td></tr>
        <tr><th>緊急連絡先①</th><td>{student.emergency1}（{student.emergency1label}）</td></tr>
        <tr><th>緊急連絡先②</th><td>{student.emergency2}（{student.emergency2label}）</td></tr>
        <tr><th>繋がりやすい時間帯</th><td>{student.contact_time}</td></tr>
        <tr><th>メモ①</th><td>{student.note1}</td></tr>
        <tr><th>メモ②</th><td>{student.note2}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="right">
    <div class="photo-box">
      {#if student.photo}
        <img src={`http://127.0.0.1:8000/photos/${student.photo}`} alt="顔写真">

      {:else}
        <div class="no-photo">写真なし</div>
      {/if}
    </div>

    <table class="info-table">
      <tbody>
        <tr><th>学生番号</th><td>{student.id}</td></tr>
        <tr><th>コース</th><td>{student.course}</td></tr>
        <tr><th>学年</th><td>{student.grade}</td></tr>
        <tr><th>クラス</th><td>{student.class_name}</td></tr>
        <tr><th>出席番号</th><td>{student.attend_no}</td></tr>
      </tbody>
    </table>

    <button on:click={openCourseModal}>コース変更</button>
    <button class="danger" on:click={() => showJoseki = true}>除籍</button>
    <button class="danger" on:click={() => showTengaku = true}>転学</button>
    <button class="danger" on:click={() => showTaigaku = true}>退学</button>
  </div>
</div>

<a href={"/students/" + student.id + "/edit"}>
  <button class="edit-btn">編集</button>
</a>

{/if}

{#if showJoseki}
<div class="modal-backdrop">
  <div class="modal">
    <h3>除籍確認</h3>

    <div class="form-group">
      <label>除籍日</label>
      <input type="date" bind:value={josekiDate} />
    </div>

    <div class="form-group">
      <label>管理者パスワード</label>
      <input type="password" bind:value={josekiPassword} />
    </div>

    <div class="actions">
      <button on:click={submitJoseki}>確定</button>
      <button on:click={() => showJoseki = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showTengaku}
<div class="modal-backdrop">
  <div class="modal">
    <h3>転学確認</h3>

    <div class="form-group">
      <label>転学日</label>
      <input type="date" bind:value={tengakuDate} />
    </div>

    <div class="form-group">
      <label>転学先学校名</label>
      <input type="text" bind:value={tengakuSchool} />
    </div>

    <div class="form-group">
      <label>管理者パスワード</label>
      <input type="password" bind:value={tengakuPassword} />
    </div>

    <div class="actions">
      <button on:click={submitTengaku}>確定</button>
      <button on:click={() => showTengaku = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showTaigaku}
<div class="modal-backdrop">
  <div class="modal">
    <h3>退学確認</h3>

    <div class="form-group">
      <label>退学日</label>
      <input type="date" bind:value={taigakuDate} />
    </div>

    <div class="form-group">
      <label>管理者パスワード</label>
      <input type="password" bind:value={taigakuPassword} />
    </div>

    <div class="actions">
      <button on:click={submitTaigaku}>確定</button>
      <button on:click={() => showTaigaku = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showCourseModal}
<div class="modal-backdrop">
  <div class="modal">
    <h3>コース変更</h3>

    <select bind:value={newCourse}>
      <option value="全">全日コース</option>
      <option value="水">水曜コース</option>
      <option value="集">集中コース</option>
    </select>

    {#if changeError}
      <p style="color:red">{changeError}</p>
    {/if}

    <button on:click={() => showCourseModal = false}>キャンセル</button>
    <button on:click={() => showPasswordModal = true} disabled={changing}>変更</button>
  </div>
</div>
{/if}

{#if showPasswordModal}
<div class="modal-backdrop">
  <div class="modal">
    <h3>管理者パスワード</h3>

    <input type="password" bind:value={adminPassword} />

    {#if passwordError}
      <p style="color:red">{passwordError}</p>
    {/if}

    <button on:click={() => showPasswordModal = false}>キャンセル</button>
    <button on:click={confirmPasswordAndChange}>実行</button>
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

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: white;
    padding: 20px;
    width: 300px;
  }

  .danger {
    background: #c0392b;
    color: white;
  }

  .edit-btn { margin-top: 20px; }

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }

  .form-group label {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
</style>

   