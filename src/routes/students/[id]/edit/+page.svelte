<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  let student = null;
  let loading = true;
  let error = "";
  let success = "";

  let id;
  $: id = $page.params.id;

  let photoFile = null;

  onMount(async () => {
    try {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error("生徒データの取得に失敗しました");
      student = await res.json();
    } catch (e) {
      error = String(e);
    }
    loading = false;
  });

  async function save() {
  error = "";
  success = "";

  try {
    // 写真アップロード（もし選択されていれば）
    if (photoFile) {
      const formData = new FormData();
      formData.append("file", photoFile);

      const uploadRes = await fetch(
        `/api/upload_photo/${id}`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("写真アップロードに失敗しました");

      const data = await uploadRes.json();
      student.photo = data.filename;
    }

    // 生徒データ保存（PUT）
    const res = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });

    if (!res.ok) throw new Error("保存に失敗しました");

    // ★ 保存成功 → 一覧ページへ戻る
    window.location.href = `/students/${id}`;

  } catch (e) {
    error = String(e);
  }
}

</script>

<h1>生徒情報 編集</h1>

{#if loading}
  <p>読み込み中...</p>
{:else if error}
  <p style="color:red">{error}</p>
{:else if student}

<div class="container">

  <!-- 左カラム：テーブル編集 -->
  <div class="left">
    <table class="info-table">
      <tbody>

        <tr><th>生徒氏名</th><td><input bind:value={student.name}></td></tr>
        <tr><th>ふりがな</th><td><input bind:value={student.kana}></td></tr>
        <tr><th>性別</th><td><input bind:value={student.gender}></td></tr>

        <tr>
          <th>生年月日</th>
          <td><input type="date" bind:value={student.birth_date}></td>
        </tr>

        <tr><th>郵便番号</th><td><input bind:value={student.postal_code}></td></tr>
        <tr><th>住所①</th><td><input bind:value={student.address1}></td></tr>
        <tr><th>住所②</th><td><input bind:value={student.address2}></td></tr>

        <tr><th>出身中学</th><td><input bind:value={student.junior_high}></td></tr>

        <tr>
          <th>中学校卒業年度</th>
          <td><input type="date" bind:value={student.junior_high_grad_date}></td>
        </tr>

        <tr>
          <th>入学年度</th>
          <td><input type="date" bind:value={student.admission_date}></td>
        </tr>

        <tr><th>通学方法</th><td><input bind:value={student.commute}></td></tr>
        <tr><th>担任</th><td><input bind:value={student.hr_teacher}></td></tr>

        <tr><th>保護者氏名</th><td><input bind:value={student.guardian1}></td></tr>
        <tr><th>保護者ふりがな</th><td><input bind:value={student.guardian1_kana}></td></tr>
        <tr><th>保護者住所</th><td><input bind:value={student.guardian_address}></td></tr>

        <tr>
          <th>緊急連絡先①</th>
          <td>
            <input bind:value={student.emergency1}>
            <br>
            続柄：<input bind:value={student.emergency1label}>
          </td>
        </tr>

        <tr>
          <th>緊急連絡先②</th>
          <td>
            <input bind:value={student.emergency2}>
            <br>
            続柄：<input bind:value={student.emergency2label}>
          </td>
        </tr>

        <tr><th>繋がりやすい時間帯</th><td><input bind:value={student.contact_time}></td></tr>

        <tr><th>メモ①</th><td><textarea bind:value={student.note1}></textarea></td></tr>
        <tr><th>メモ②</th><td><textarea bind:value={student.note2}></textarea></td></tr>

      </tbody>
    </table>
  </div>

  <!-- 右カラム：写真＋学籍情報（編集不可） -->
  <div class="right">

    <div class="photo-box">
      {#if student.photo}
        <img src={"/api/photos/" + student.photo} alt="顔写真">
      {:else}
        <div class="no-photo">写真なし</div>
      {/if}
    </div>

    <!-- 写真だけ編集可能 -->
    <input type="file" accept="image/*" on:change={(e) => photoFile = e.target.files[0]}>

    <table class="info-table">
      <tbody>
        <tr><th>学生番号</th><td>{student.id}</td></tr>
        <tr><th>コース</th><td>{student.course}</td></tr>
        <tr><th>学年</th><td>{student.grade}</td></tr>
        <tr><th>クラス</th><td>{student.class_name}</td></tr>
        <tr><th>出席番号</th><td>{student.attend_no}</td></tr>
      </tbody>
    </table>

  </div>


</div>

<button class="save-btn" on:click={save}>保存</button>

{#if success}
  <p style="color:green">{success}</p>
{/if}

{/if}

<style>
  .container {
    display: flex;
    gap: 40px;
  }

  .left, .right {
    width: 50%;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    border: 1px solid #ccc;
  }

  .info-table th,
  .info-table td {
    border: 1px solid #ccc;
    padding: 6px 8px;
  }

  .info-table th {
    width: 180px;
    background: #f7f7f7;
    font-weight: bold;
    vertical-align: top;
  }

  .photo-box img {
    width: 170px;
    height: auto;
    border: 1px solid #ccc;
    margin-bottom: 20px;
  }

  .no-photo {
    width: 170px;
    height: 200px;
    background: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    border: 1px solid #ccc;
  }

  .save-btn {
    margin-top: 20px;
  }
</style>
