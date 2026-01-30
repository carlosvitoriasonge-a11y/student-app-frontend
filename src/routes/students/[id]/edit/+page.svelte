<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiFetch } from "$lib/api";

  let student = null;
  let loading = true;
  let error = "";
  let success = "";

  let id;
  $: id = $page.params.id;

  let photoFile = null;
  let photoUrl = null;

  console.log("BASE:", import.meta.env.VITE_API_BASE);

  // -------------------------------
  // 生徒データ取得
  // -------------------------------
  function normalizeDateForInput(d) {
    if (!d) return "";
    if (/^\d{4}\/\d{1,2}$/.test(d)) {
      const [y, m] = d.split("/");
      return `${y}-${m.padStart(2, "0")}-01`;
    }
    return d;
  }

  onMount(async () => {
    try {
      student = await apiFetch(`/api/students/${id}`);

    // Normaliza datas sem dia para o input
    student.junior_high_grad_date = normalizeDateForInput(student.junior_high_grad_date);

      await loadPhoto();
    } catch (e) {
      error = "生徒データの取得に失敗しました";
      console.error(e);
    }
    loading = false;
  });

  // -------------------------------
  // 写真読み込み（TOKEN付き）
  // -------------------------------
  async function loadPhoto() {
    if (!student?.photo) {
      photoUrl = null;
      return;
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/photos/${student.photo}`);


      if (!res.ok) {
        console.error("写真読み込み失敗:", res.status);
        photoUrl = null;
        return;
      }

      const blob = await res.blob();
      photoUrl = URL.createObjectURL(blob);

    } catch (e) {
      console.error("写真読み込み失敗:", e);
      photoUrl = null;
    }
  }

  // -------------------------------
  // 保存処理
  // -------------------------------
  async function save() {
    error = "";
    success = "";

    try {
      // 写真アップロード（もし選択されていれば）
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        const uploadData = await apiFetch(
          `/upload_photo/${id}`,
          {
            method: "POST",
            body: formData
          }
        );

        student.photo = uploadData.filename;
        student = { ...student };
        await loadPhoto();
      }

      // 生徒データ保存（PUT）
      await apiFetch(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(student)
      });

      window.location.href = `/students/${id}`;

    } catch (e) {
      console.error(e);
      error = "保存に失敗しました";
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
        <tr>
          <th>編入学</th>
          <td><input type="date" bind:value={student.transfer_advanced_date}></td>
        </tr>
        
        <tr>
          <th>転入学</th>
          <td><input type="date" bind:value={student.transfer_date}></td>
        </tr>
        
        <tr>
          <th>前在籍校</th>
          <td><input bind:value={student.previous_school}></td>
        </tr>
        
        <tr>
          <th>課程</th>
          <td><input bind:value={student.course_type}></td>
        </tr>
        
        <tr>
          <th>前在籍校住所</th>
          <td><input bind:value={student.previous_school_address}></td>
        </tr>
        

        <tr><th>通学方法</th><td><input bind:value={student.commute}></td></tr>
        

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
      {#if photoUrl}
        <img src={photoUrl} alt="顔写真">
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
