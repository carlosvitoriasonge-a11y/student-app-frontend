<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";

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
      const res = await fetch("/api/students/change_course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          new_course: newCourse,
          password
        })
      });

      if (!res.ok) throw new Error("変更失敗");

      const result = await res.json();

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

  // ====== 和暦変換 ======
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
      const res = await fetch(`/api/students/${id}`, {
        cache: "no-store"
      });
      if (!res.ok) throw new Error("生徒データの取得に失敗しました");
      student = await res.json();
    } catch (e) {
      error = String(e);
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
        <img src={`http://${window.location.hostname}/photos/${student.photo}`} alt="顔写真">
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

  </div>
</div>

<a href={"/students/" + student.id + "/edit"}>
  <button class="edit-btn">編集</button>
</a>

{/if}

<!-- COURSE MODAL -->
{#if showCourseModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h3>コース変更</h3>

      <select bind:value={newCourse}>
        <option value="全">全日コース</option>
        <option value="水">水曜コース</option>
        <option value="集">集中コース</option>
      </select>

      {#if newCourse === "z"}
        <p>クラスと出席番号はリセットされます。</p>
      {:else}
        <p>出席番号は自動で末尾に追加されます。</p>
      {/if}

      {#if changeError}
        <p style="color:red">{changeError}</p>
      {/if}

      <button on:click={() => showCourseModal = false}>キャンセル</button>
      <button on:click={() => showPasswordModal = true} disabled={changing}>
        変更
      </button>
    </div>
  </div>
{/if}

<!-- PASSWORD MODAL -->
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

  .edit-btn { margin-top: 20px; }
</style>
