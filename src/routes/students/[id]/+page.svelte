<script>
  export const ssr = false;
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { apiFetch } from "$lib/api";
  const API_BASE = import.meta.env.VITE_API_BASE;

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

  // ====== MOUSHIOKURI (中学校からの申し送り) ======
  let showMoushiokuriModal = false;
  let showMoushiokuriAddModal = false;
  let moushiokuriText = "";
  let moushiokuriTeacher = "";
  let moushiokuriError = "";

  async function addMoushiokuri() {
    if (!moushiokuriText.trim()) {
      moushiokuriError = "内容を入力してください";
      return;
    }

    if (!moushiokuriTeacher.trim()) {
      moushiokuriError = "担当者名を入力してください";
      return;
    }

    moushiokuriError = "";

    try {
      await apiFetch("/api/students/add_moushiokuri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          text: moushiokuriText,
          teacher: moushiokuriTeacher
        })
      });

      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });

      showMoushiokuriAddModal = false;
      moushiokuriText = "";
      moushiokuriTeacher = "";
    } catch (e) {
      moushiokuriError = "保存に失敗しました";
    }
  }

  // ====== SHIDOU (指導履歴) ======
  let showShidouModal = false;
  let showShidouAddModal = false;
  let shidouText = "";
  let shidouError = "";
  let shidouTeacher = "";

  async function addShidou() {
    if (!shidouText.trim()) {
      shidouError = "指導内容を入力してください";
      return;
    }

    shidouError = "";

    try {
      await apiFetch("/api/students/add_shidou", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          text: shidouText,
          teacher: shidouTeacher
        })
      });

      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });

      showShidouAddModal = false;
      shidouText = "";
      shidouTeacher = "";
    } catch (e) {
      shidouError = "保存に失敗しました";
    }
  }

  // ====== ZEMI 活動 ======
  let zemiGrade = "";
  let showZemiModal = false;
  let showZemiAddModal = false;
  let zemiText = "";
  let zemiTeacher = "";
  let zemiError = "";

  async function addZemi() {
    if (!zemiText.trim()) {
      zemiError = "内容を入力してください";
      return;
    }
    if (!zemiTeacher.trim()) {
      zemiError = "担当者名を入力してください";
      return;
    }

    zemiError = "";

    try {
      await apiFetch("/api/students/add_zemi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          text: zemiText,
          teacher: zemiTeacher,
          grade: zemiGrade
        })
      });

      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });

      showZemiAddModal = false;
      zemiText = "";
      zemiTeacher = "";
      zemiGrade = "";
    } catch (e) {
      zemiError = "保存に失敗しました";
    }
  }

  // ====== 部活動 ======
  let bukatsuGrade = "";
  let showBukatsuModal = false;
  let showBukatsuAddModal = false;
  let bukatsuText = "";
  let bukatsuTeacher = "";
  let bukatsuError = "";

  async function addBukatsu() {
    if (!bukatsuText.trim()) {
      bukatsuError = "内容を入力してください";
      return;
    }
    if (!bukatsuTeacher.trim()) {
      bukatsuError = "担当者名を入力してください";
      return;
    }

    bukatsuError = "";

    try {
      await apiFetch("/api/students/add_bukatsu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          text: bukatsuText,
          teacher: bukatsuTeacher,
          grade: bukatsuGrade
        })
      });

      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });

      showBukatsuAddModal = false;
      bukatsuText = "";
      bukatsuTeacher = "";
      bukatsuGrade = "";
    } catch (e) {
      bukatsuError = "保存に失敗しました";
    }
  }

  // ====== 役員情報 ======
  let yakuinGrade = "";
  let showYakuinModal = false;
  let showYakuinAddModal = false;
  let yakuinText = "";
  let yakuinTeacher = "";
  let yakuinError = "";

  async function addYakuin() {
    if (!yakuinText.trim()) {
      yakuinError = "内容を入力してください";
      return;
    }
    if (!yakuinTeacher.trim()) {
      yakuinError = "担当者名を入力してください";
      return;
    }

    yakuinError = "";

    try {
      await apiFetch("/api/students/add_yakuin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          text: yakuinText,
          teacher: yakuinTeacher,
          grade: yakuinGrade
        })
      });

      student = await apiFetch(`/api/students/${id}`, { cache: "no-store" });

      showYakuinAddModal = false;
      yakuinText = "";
      yakuinTeacher = "";
      yakuinGrade = "";
    } catch (e) {
      yakuinError = "保存に失敗しました";
    }
  }

  // =====================================================
  // 申し送り 編集 / 削除
  // =====================================================
  let showEditMoushiokuriModal = false;
  let showDeleteMoushiokuriModal = false;
  let editingMoushiokuri = null;
  let deletingMoushiokuri = null;
  let editMoushiokuriTeacher = "";
  let editMoushiokuriText = "";

  function startEditMoushiokuri(n) {
    editingMoushiokuri = n;
    editMoushiokuriTeacher = n.teacher;
    editMoushiokuriText = n.text;
    showEditMoushiokuriModal = true;
  }

  async function saveMoushiokuriEdit() {
    await apiFetch("/api/students/edit_moushiokuri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        original_date: editingMoushiokuri.date,
        teacher: editMoushiokuriTeacher,
        text: editMoushiokuriText
      })
    });

    editingMoushiokuri.teacher = editMoushiokuriTeacher;
    editingMoushiokuri.text = editMoushiokuriText;

      // 🔥 FORÇA RE-RENDER
  student.moushiokuri_history = [...student.moushiokuri_history];

    showEditMoushiokuriModal = false;
  }

  function confirmDeleteMoushiokuri(n) {
    deletingMoushiokuri = n;
    showDeleteMoushiokuriModal = true;
  }

  async function deleteMoushiokuri() {
    await apiFetch("/api/students/delete_moushiokuri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: deletingMoushiokuri.date
      })
    });

    student.moushiokuri_history = student.moushiokuri_history.filter(
      x => x.date !== deletingMoushiokuri.date
    );

    showDeleteMoushiokuriModal = false;
  }

  // =====================================================
  // 指導履歴 編集 / 削除
  // =====================================================
  let showEditShidouModal = false;
  let showDeleteShidouModal = false;
  let editingShidou = null;
  let deletingShidou = null;
  let editShidouTeacher = "";
  let editShidouText = "";

  function startEditShidou(g) {
    editingShidou = g;
    editShidouTeacher = g.teacher;
    editShidouText = g.text;
    showEditShidouModal = true;
  }

  async function saveShidouEdit() {
    await apiFetch("/api/students/edit_shidou", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        original_date: editingShidou.date,
        teacher: editShidouTeacher,
        text: editShidouText
      })
    });

    editingShidou.teacher = editShidouTeacher;
    editingShidou.text = editShidouText;

      // 🔥 FORÇA RE-RENDER
  student.shidou_history = [...student.shidou_history];

    showEditShidouModal = false;
  }

  function confirmDeleteShidou(g) {
    deletingShidou = g;
    showDeleteShidouModal = true;
  }

  async function deleteShidou() {
    await apiFetch("/api/students/delete_shidou", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: deletingShidou.date
      })
    });

    student.shidou_history = student.shidou_history.filter(
      x => x.date !== deletingShidou.date
    );

    showDeleteShidouModal = false;
  }

  // =====================================================
  // ゼミ 編集 / 削除
  // =====================================================
  let showEditZemiModal = false;
  let showDeleteZemiModal = false;
  let editingZemi = null;
  let deletingZemi = null;
  let editZemiGrade = "";
  let editZemiTeacher = "";
  let editZemiText = "";

  function startEditZemi(z) {
    editingZemi = z;
    editZemiGrade = z.grade;
    editZemiTeacher = z.teacher;
    editZemiText = z.text;
    showEditZemiModal = true;
  }

  async function saveZemiEdit() {
    await apiFetch("/api/students/edit_zemi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        original_date: editingZemi.date,
        grade: editZemiGrade,
        teacher: editZemiTeacher,
        text: editZemiText
      })
    });

    editingZemi.grade = editZemiGrade;
    editingZemi.teacher = editZemiTeacher;
    editingZemi.text = editZemiText;

      // 🔥 FORÇA RE-RENDER
  student.zemi_history = [...student.zemi_history];

    showEditZemiModal = false;
  }

  function confirmDeleteZemi(z) {
    deletingZemi = z;
    showDeleteZemiModal = true;
  }

  async function deleteZemi() {
    await apiFetch("/api/students/delete_zemi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: deletingZemi.date
      })
    });

    student.zemi_history = student.zemi_history.filter(
      x => x.date !== deletingZemi.date
    );

    showDeleteZemiModal = false;
  }

  // =====================================================
  // 部活 編集 / 削除
  // =====================================================
  let showEditBukatsuModal = false;
  let showDeleteBukatsuModal = false;
  let editingBukatsu = null;
  let deletingBukatsu = null;
  let editBukatsuGrade = "";
  let editBukatsuTeacher = "";
  let editBukatsuText = "";

  function startEditBukatsu(b) {
    editingBukatsu = b;
    editBukatsuGrade = b.grade;
    editBukatsuTeacher = b.teacher;
    editBukatsuText = b.text;
    showEditBukatsuModal = true;
  }

  async function saveBukatsuEdit() {
    await apiFetch("/api/students/edit_bukatsu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        original_date: editingBukatsu.date,
        grade: editBukatsuGrade,
        teacher: editBukatsuTeacher,
        text: editBukatsuText
      })
    });

    editingBukatsu.grade = editBukatsuGrade;
    editingBukatsu.teacher = editBukatsuTeacher;
    editingBukatsu.text = editBukatsuText;

      // 🔥 FORÇA RE-RENDER
  student.bukatsu_history = [...student.bukatsu_history];

    showEditBukatsuModal = false;
  }

  function confirmDeleteBukatsu(b) {
    deletingBukatsu = b;
    showDeleteBukatsuModal = true;
  }

  async function deleteBukatsu() {
    await apiFetch("/api/students/delete_bukatsu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: deletingBukatsu.date
      })
    });

    student.bukatsu_history = student.bukatsu_history.filter(
      x => x.date !== deletingBukatsu.date
    );

    showDeleteBukatsuModal = false;
  }

  // =====================================================
  // 役員 編集 / 削除
  // =====================================================
  let showEditYakuinModal = false;
  let showDeleteYakuinModal = false;
  let editingYakuin = null;
  let deletingYakuin = null;
  let editYakuinGrade = "";
  let editYakuinTeacher = "";
  let editYakuinText = "";

  function startEditYakuin(y) {
    editingYakuin = y;
    editYakuinGrade = y.grade;
    editYakuinTeacher = y.teacher;
    editYakuinText = y.text;
    showEditYakuinModal = true;
  }

  async function saveYakuinEdit() {
    await apiFetch("/api/students/edit_yakuin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        original_date: editingYakuin.date,
        grade: editYakuinGrade,
        teacher: editYakuinTeacher,
        text: editYakuinText
      })
    });

    editingYakuin.grade = editYakuinGrade;
    editingYakuin.teacher = editYakuinTeacher;
    editingYakuin.text = editYakuinText;

      // 🔥 FORÇA RE-RENDER
  student.yakuin_history = [...student.yakuin_history];

    showEditYakuinModal = false;
  }

  function confirmDeleteYakuin(y) {
    deletingYakuin = y;
    showDeleteYakuinModal = true;
  }

  async function deleteYakuin() {
    await apiFetch("/api/students/delete_yakuin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: deletingYakuin.date
      })
    });

    student.yakuin_history = student.yakuin_history.filter(
      x => x.date !== deletingYakuin.date
    );

    showDeleteYakuinModal = false;
  }

  // ====== SUSPEND / RETURN ======
  let showSuspend = false;
  let showReturn = false;
  let showSuspendPassword = false;
  let showReturnPassword = false;
  let suspendPassword = "";
  let suspendPasswordError = "";
  let returnPassword = "";
  let returnPasswordError = "";
  let suspendDate = "";
  let returnDate = "";

  function confirmReturnPassword() {
    if (!returnPassword) {
      returnPasswordError = "パスワードを入力してください";
      return;
    }

    if (!returnDate) {
      returnPasswordError = "復学日を入力してください";
      return;
    }

    returnPasswordError = "";
    showReturnPassword = false;

    submitReturn();

    returnPassword = "";
    returnDate = "";
  }

  async function submitReturnWithPassword(date, password) {
    try {
      await apiFetch(`/api/students/${student.id}/return_with_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, password })
      });

      alert("在籍に戻しました");
      location.reload();
    } catch (e) {
      alert("復学処理に失敗しました");
    }
  }

  async function submitSuspend() {
    if (!suspendDate) {
      alert("休学開始日を入力してください");
      return;
    }

    try {
      await apiFetch(`/api/students/${student.id}/suspend?date=${suspendDate}`, {
        method: "POST"
      });

      alert("休学に変更しました");
      location.reload();
    } catch (e) {
      alert("休学処理に失敗しました");
    }
  }

  async function submitReturn() {
    if (!returnDate) {
      alert("復学日を入力してください");
      return;
    }

    try {
      await apiFetch(`/api/students/${student.id}/return?date=${returnDate}`, {
        method: "POST"
      });

      alert("在籍に戻しました");
      location.reload();
    } catch (e) {
      alert("復学処理に失敗しました");
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
    if (!dateStr) return "-";

    const ymd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const y = parseInt(ymd[1]);
      const m = parseInt(ymd[2]);
      const d = parseInt(ymd[3]);

      let era = "";
      let eraYear = y;

      if (y >= 2019) {
        era = "令和";
        eraYear = y - 2018;
      } else if (y >= 1989) {
        era = "平成";
        eraYear = y - 1988;
      } else if (y >= 1926) {
        era = "昭和";
        eraYear = y - 1925;
      } else {
        return `${y}年${m}月${d}日`;
      }

      return `${y}年${m}月${d}日（${era}${eraYear}年）`;
    }

    const ym = dateStr.match(/^(\d{4})\/(\d{1,2})$/);
    if (ym) {
      const y = parseInt(ym[1]);
      const m = parseInt(ym[2]);

      if (y >= 2019) return `令和${y - 2018}年 ${m}月`;
      if (y >= 1989) return `平成${y - 1988}年 ${m}月`;
      if (y >= 1926) return `昭和${y - 1925}年 ${m}月`;
      return `${y}年 ${m}月`;
    }

    const d = new Date(dateStr);
    if (isNaN(d)) return "-";

    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (y >= 2019) return `令和${y - 2018}年 ${m}月${day}日`;
    if (y >= 1989) return `平成${y - 1988}年 ${m}月${day}日`;
    if (y >= 1926) return `昭和${y - 1925}年 ${m}月${day}日`;
    return `${y}年 ${m}月${day}日`;
  }

  function confirmSuspendPassword() {
    if (!suspendPassword) {
      suspendPasswordError = "パスワードを入力してください";
      return;
    }

    if (!suspendDate) {
      suspendPasswordError = "休学開始日を入力してください";
      return;
    }

    suspendPasswordError = "";
    showSuspendPassword = false;

    submitSuspend();
    suspendPassword = "";
  }

  async function submitSuspendWithPassword(date, password) {
    try {
      await apiFetch(`/api/students/${student.id}/suspend_with_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, password })
      });

      alert("休学に変更しました");
      location.reload();
    } catch (e) {
      alert("休学処理に失敗しました");
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch(`/upload_photo/${student.id}`, {
        method: "POST",
        body: formData
      });

      student.photo = res.filename;
      student = { ...student };
    } catch (e) {
      alert("写真のアップロードに失敗しました");
    }
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

<a href={"/students/" + student.id + "/edit"}>
  <button class="edit-btn">編集</button>
</a>

<div class="container">
  <div class="left">
    <table class="info-table">
      <tbody>
        <tr>
          <th>生徒氏名</th>
          <td>{student.name}</td>
        </tr>
        <tr>
          <th>ふりがな</th>
          <td>{student.kana}</td>
        </tr>
        <tr>
          <th>性別</th>
          <td>{student.gender}</td>
        </tr>
        <tr>
          <th>生年月日</th>
          <td>{student.birth_date}（{toWareki(student.birth_date)}）</td>
        </tr>
        <tr>
          <th>郵便番号</th>
          <td>{student.postal_code}</td>
        </tr>
        <tr>
          <th>住所①</th>
          <td>{student.address1}</td>
        </tr>
        <tr>
          <th>住所②</th>
          <td>{student.address2}</td>
        </tr>
        <tr>
          <th>出身中学</th>
          <td>{student.junior_high}</td>
        </tr>
        <tr>
          <th>中学校卒業年度</th>
          <td>{student.junior_high_grad_date || "-"}（{toWareki(student.junior_high_grad_date)}）</td>
        </tr>
        <tr>
          <th>編入学</th>
          <td>{student.transfer_advanced_date || "-"}（{toWareki(student.transfer_advanced_date)}）</td>
        </tr>
        <tr>
          <th>転入学</th>
          <td>{student.transfer_date || "-"}（{toWareki(student.transfer_date)}）</td>
        </tr>
        <tr>
          <th>前在籍校</th>
          <td>{student.previous_school || "-"}</td>
        </tr>
        <tr>
          <th>課程</th>
          <td>{student.course_type || "-"}</td>
        </tr>
        <tr>
          <th>前在籍校住所</th>
          <td>{student.previous_school_address || "-"}</td>
        </tr>
        <tr>
          <th>入学年度</th>
          <td>{student.admission_date || "-"}（{toWareki(student.admission_date)}）</td>
        </tr>
        <tr>
          <th>通学方法</th>
          <td>{student.commute}</td>
        </tr>
        <tr>
          <th>担任</th>
          <td>{student.hr_teacher || "-"}</td>
        </tr>
        <tr>
          <th>保護者氏名</th>
          <td>{student.guardian1}</td>
        </tr>
        <tr>
          <th>保護者ふりがな</th>
          <td>{student.guardian1_kana}</td>
        </tr>
        <tr>
          <th>父</th>
          <td>{student.father || "-"}</td>
        </tr>
        
        <tr>
          <th>母</th>
          <td>{student.mother || "-"}</td>
        </tr>
        
        <tr>
          <th>保護者住所</th>
          <td>{student.guardian_address}</td>
        </tr>
        <tr>
          <th>緊急連絡先①</th>
          <td>{student.emergency1}（{student.emergency1label}）</td>
        </tr>
        <tr>
          <th>緊急連絡先②</th>
          <td>{student.emergency2}（{student.emergency2label}）</td>
        </tr>
        <tr>
          <th>繋がりやすい時間帯</th>
          <td>{student.contact_time}</td>
        </tr>
        <tr>
          <th>メモ①</th>
          <td>{student.note1}</td>
        </tr>
        <tr>
          <th>メモ②</th>
          <td>{student.note2}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="right">
    <div class="photo-box">
      {#if student.photo}
        <img src={`http://${window.location.hostname}:8000/photos/${student.photo}?t=${Date.now()}`} alt="顔写真">
      {:else}
        <div class="no-photo">写真なし</div>
      {/if}
    </div>

    <div class="photo-actions">
      <input
        id="photoInput"
        type="file"
        accept="image/*"
        style="display:none"
        on:change={uploadPhoto}
      />

      <button on:click={() => document.getElementById('photoInput').click()}>
        写真を変更
      </button>
    </div>
    

    <table class="info-table">
      <tbody>
        <tr>
          <th>学生番号</th>
          <td>{student.id}</td>
        </tr>
        <tr>
          <th>コース</th>
          <td>{student.course}</td>
        </tr>
        <tr>
          <th>学年</th>
          <td>{student.grade}</td>
        </tr>
        <tr>
          <th>クラス</th>
          <td>{student.class_name}</td>
        </tr>
        <tr>
          <th>出席番号</th>
          <td>{student.attend_no}</td>
        </tr>
      </tbody>
    </table>
    
    <button on:click={openCourseModal}>コース変更</button>
    <button class="danger" on:click={() => showJoseki = true}>除籍</button>
    <button class="danger" on:click={() => showTengaku = true}>転学</button>
    <button class="danger" on:click={() => showTaigaku = true}>退学</button>
    {#if student.status?.trim() === "在籍"}
    <button class="danger" on:click={() => showSuspendPassword = true}>休学する</button>
    {/if}

    {#if student.status?.trim() === "休学"}
    <button class="danger" on:click={() => showReturnPassword = true}>復学する</button>
    {/if}


    <h3>中学校からの申し送り・引き継ぎなど</h3>

    <!-- ========================= -->
<!-- 中学校からの申し送り（一覧表示） -->
<!-- ========================= -->


{#if student.moushiokuri_history && student.moushiokuri_history.length > 0}
  <div class="notes-list">
    {#each student.moushiokuri_history as n}
      <div class="note-item">
        <div><strong>日付:</strong> {n.date}</div>
        <div><strong>担当:</strong> {n.teacher}</div>
        <div><strong>内容:</strong> {n.text}</div>

        <div style="margin-top:6px; display:flex; gap:10px;">
          <button on:click={() => startEditMoushiokuri(n)}>編集</button>
          <button class="danger" on:click={() => confirmDeleteMoushiokuri(n)}>削除</button>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p>申し送りはありません。</p>
{/if}


    <button on:click={() => showMoushiokuriModal = true}>
      申し送りを入力する
    </button>


    <!-- ========================= -->
<!-- 指導履歴（一覧表示） -->
<!-- ========================= -->
<h3>指導履歴</h3>

{#if student.shidou_history && student.shidou_history.length > 0}
  <div class="guidance-list">
    {#each student.shidou_history as g}
      <div class="guidance-item">
        <div><strong>日付:</strong> {g.date}</div>
        <div><strong>担当:</strong> {g.teacher || "-"}</div>
        <div><strong>内容:</strong> {g.text}</div>

        <div style="margin-top:6px; display:flex; gap:10px;">
          <button on:click={() => startEditShidou(g)}>編集</button>
          <button class="danger" on:click={() => confirmDeleteShidou(g)}>削除</button>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p>指導履歴はありません。</p>
{/if}


<button on:click={() => showShidouModal = true}>
  指導内容を入力する
</button>


<!-- ========================= -->
<!-- ゼミ活動 -->
<!-- ========================= -->
<h2>ゼミ活動・ボランティア活動など</h2>

{#if student.zemi_history && student.zemi_history.length > 0}
  <div class="notes-list">
    {#each student.zemi_history as z}
      <div class="note-item">
        <div><strong>学年:</strong> {z.grade || "-"}</div>
        <div><strong>担当:</strong> {z.teacher || "-"}</div>
        <div><strong>内容:</strong> {z.text}</div>

        <div style="margin-top:6px; display:flex; gap:10px;">
          <button on:click={() => startEditZemi(z)}>編集</button>
          <button class="danger" on:click={() => confirmDeleteZemi(z)}>削除</button>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p>記録はありません。</p>
{/if}


<button on:click={() => showZemiAddModal = true}>追加</button>

<br /><br />

<!-- ========================= -->
<!-- 部活動・サークル活動 -->
<!-- ========================= -->
<h2>部活動・サークル活動</h2>

{#if student.bukatsu_history && student.bukatsu_history.length > 0}
  <div class="notes-list">
    {#each student.bukatsu_history as b}
      <div class="note-item">
        <div><strong>学年:</strong> {b.grade || "-"}</div>
        <div><strong>担当:</strong> {b.teacher || "-"}</div>
        <div><strong>内容:</strong> {b.text}</div>

        <div style="margin-top:6px; display:flex; gap:10px;">
          <button on:click={() => startEditBukatsu(b)}>編集</button>
          <button class="danger" on:click={() => confirmDeleteBukatsu(b)}>削除</button>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p>記録はありません。</p>
{/if}


<button on:click={() => showBukatsuAddModal = true}>追加</button>

<br /><br />

<!-- ========================= -->
<!-- 役員情報 -->
<!-- ========================= -->
<h2>役員情報</h2>

{#if student.yakuin_history && student.yakuin_history.length > 0}
  <div class="notes-list">
    {#each student.yakuin_history as y}
      <div class="note-item">
        <div><strong>学年:</strong> {y.grade || "-"}</div>
        <div><strong>担当:</strong> {y.teacher || "-"}</div>
        <div><strong>内容:</strong> {y.text}</div>

        <div style="margin-top:6px; display:flex; gap:10px;">
          <button on:click={() => startEditYakuin(y)}>編集</button>
          <button class="danger" on:click={() => confirmDeleteYakuin(y)}>削除</button>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p>記録はありません。</p>
{/if}


<button on:click={() => showYakuinAddModal = true}>追加</button>




 

    {#if showMoushiokuriModal}
    <div class="modal-backdrop">
      <div class="modal large">
        <h3>中学校からの申し送り</h3>
        
    

    
        <div class="actions">
          <button on:click={() => showMoushiokuriAddModal = true}>＋ 追加</button>
          <button on:click={() => showMoushiokuriModal = false}>閉じる</button>
        </div>
      </div>
    </div>
    {/if}
    

    {#if showMoushiokuriAddModal}
<div class="modal-backdrop">
  <div class="modal">
    <h3>申し送りを追加</h3>

    <div class="form-group">
      <label>担当者</label>
      <input type="text" bind:value={moushiokuriTeacher} />
    </div>

    <div class="form-group">
      <label>内容</label>
      <textarea rows="4" bind:value={moushiokuriText}></textarea>
    </div>

    {#if moushiokuriError}
      <p style="color:red">{moushiokuriError}</p>
    {/if}

    <div class="actions">
      <button on:click={addMoushiokuri}>追加</button>
      <button on:click={() => { 
        showMoushiokuriAddModal = false; 
        moushiokuriText = ""; 
        moushiokuriTeacher = ""; 
      }}>キャンセル</button>
    </div>
  </div>
</div>
{/if}



{#if showShidouModal}
<div class="modal-backdrop">
  <div class="modal" style="width: 500px; max-height: 80vh; overflow-y: auto;">
    <h3>指導履歴</h3>


    <div class="actions">
      <button on:click={() => showShidouAddModal = true}>＋ 追加</button>
      <button on:click={() => showShidouModal = false}>閉じる</button>
    </div>
  </div>
</div>
{/if}

{#if showShidouAddModal}
<div class="modal-backdrop">
  <div class="modal">
    <h3>指導内容を追加</h3>

    <div class="form-group">
      <label>指導内容</label>
      <textarea bind:value={shidouText} rows="4"></textarea>
    </div>

    <div class="form-group">
      <label>教員名
      </label>
      <input type="text" bind:value={shidouTeacher} />
    </div>
    

    {#if shidouError}
      <p style="color:red">{shidouError}</p>
    {/if}

    <div class="actions">
      <button on:click={addShidou}>追加</button>
      <button on:click={() => { showShidouAddModal = false; shidouText = ""; }}>キャンセル</button>
    </div>
  </div>
</div>
{/if}




    

    <h3>休学履歴</h3>
    {#if student.suspension_history && student.suspension_history.length > 0}
      <table class="history-table">
        <thead>
          <tr>
            <th>回数</th>
            <th>開始日</th>
            <th>終了日</th>
          </tr>
        </thead>

        <tbody>
          {#each student.suspension_history as entry, i}
            <tr>
              <td>{i + 1}回目</td>
              <td>{toWareki(entry.start)}</td>
              <td>{entry.end ? toWareki(entry.end): "（現在休学中）"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>休学履歴はありません。</p>
    {/if}



  </div>

</div>

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
      <option value="z">全日コース</option>
      <option value="w">水曜コース</option>
      <option value="s">集中コース</option>
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

{#if showSuspend}
<div class="modal-backdrop">
  <div class="modal">
    <h3>休学開始日</h3>

    <div class="form-group">
      <label>開始日</label>
      <input type="date" bind:value={suspendDate} />
    </div>

    <div class="actions">
      <button on:click={submitSuspend}>確定</button>
      <button on:click={() => showSuspend = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showSuspendPassword}
<div class="modal-backdrop">
  <div class="modal">
    <h3>休学処理</h3>

    <div class="form-group">
      <label>休学開始日</label>
      <input type="date" bind:value={suspendDate} />
    </div>

    <div class="form-group">
      <label>管理者パスワード</label>
      <input type="password" bind:value={suspendPassword} />
    </div>

    {#if suspendPasswordError}
      <p style="color:red">{suspendPasswordError}</p>
    {/if}

    <div class="actions">
      <button on:click={confirmSuspendPassword}>確定</button>
      <button on:click={() => showSuspendPassword = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showReturn}
<div class="modal-backdrop">
  <div class="modal">
    <h3>復学日</h3>

    <div class="form-group">
      <label>復学日</label>
      <input type="date" bind:value={returnDate} />
    </div>

    <div class="actions">
      <button on:click={submitReturn}>確定</button>
      <button on:click={() => showReturn = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showReturnPassword}
<div class="modal-backdrop">
  <div class="modal">
    <h3>復学処理</h3>

    <div class="form-group">
      <label>復学日</label>
      <input type="date" bind:value={returnDate} />
    </div>

    <div class="form-group">
      <label>管理者パスワード</label>
      <input type="password" bind:value={returnPassword} />
    </div>

    {#if returnPasswordError}
      <p style="color:red">{returnPasswordError}</p>
    {/if}

    <div class="actions">
      <button on:click={confirmReturnPassword}>確定</button>
      <button on:click={() => showReturnPassword = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showZemiAddModal}
  <div class="modal-backdrop">
    <div class="modal-box">

      <h3>ゼミ活動の追加</h3>

      <label>学年</label>
<select bind:value={zemiGrade}>
  <option value="">選択してください</option>
  <option value="1">1年</option>
  <option value="2">2年</option>
  <option value="3">3年</option>
</select>


      <label>内容</label>
      <textarea bind:value={zemiText} rows="4"></textarea>

      <label>担当者</label>
      <input type="text" bind:value={zemiTeacher} />

      {#if zemiError}
        <p class="error">{zemiError}</p>
      {/if}

      <div class="modal-buttons">
        <button on:click={addZemi}>保存</button>
        <button class="cancel" on:click={() => showZemiAddModal = false}>キャンセル</button>
      </div>

    </div>
  </div>
{/if}


{#if showBukatsuAddModal}
  <div class="modal-backdrop">
    <div class="modal-box">

      <h3>部活動・サークル活動の追加</h3>

      <label>学年</label>
<select bind:value={bukatsuGrade}>
  <option value="">選択してください</option>
  <option value="1">1年</option>
  <option value="2">2年</option>
  <option value="3">3年</option>
</select>


      <label>内容</label>
      <textarea bind:value={bukatsuText} rows="4"></textarea>

      <label>担当者</label>
      <input type="text" bind:value={bukatsuTeacher} />

      {#if bukatsuError}
        <p class="error">{bukatsuError}</p>
      {/if}

      <div class="modal-buttons">
        <button on:click={addBukatsu}>保存</button>
        <button class="cancel" on:click={() => showBukatsuAddModal = false}>キャンセル</button>
      </div>

    </div>
  </div>
{/if}


{#if showYakuinAddModal}
  <div class="modal-backdrop">
    <div class="modal-box">

      <h3>役員情報の追加</h3>

      <label>学年</label>
<select bind:value={yakuinGrade}>
  <option value="">選択してください</option>
  <option value="1">1年</option>
  <option value="2">2年</option>
  <option value="3">3年</option>
</select>


      <label>内容</label>
      <textarea bind:value={yakuinText} rows="4"></textarea>

      <label>担当者</label>
      <input type="text" bind:value={yakuinTeacher} />

      {#if yakuinError}
        <p class="error">{yakuinError}</p>
      {/if}

      <div class="modal-buttons">
        <button on:click={addYakuin}>保存</button>
        <button class="cancel" on:click={() => showYakuinAddModal = false}>キャンセル</button>
      </div>

    </div>
  </div>
{/if}

{#if showEditMoushiokuriModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3>申し送りの編集</h3>

    <label>担当者</label>
    <input type="text" bind:value={editMoushiokuriTeacher} />

    <label>内容</label>
    <textarea rows="4" bind:value={editMoushiokuriText}></textarea>

    <div class="modal-buttons">
      <button on:click={saveMoushiokuriEdit}>保存</button>
      <button class="cancel" on:click={() => showEditMoushiokuriModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showDeleteMoushiokuriModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3 style="color:red;">削除確認</h3>
    <p>この申し送りを削除しますか？</p>

    <div class="modal-buttons">
      <button class="danger" on:click={deleteMoushiokuri}>削除</button>
      <button class="cancel" on:click={() => showDeleteMoushiokuriModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showEditShidouModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3>指導内容の編集</h3>

    <label>担当</label>
    <input type="text" bind:value={editShidouTeacher} />

    <label>内容</label>
    <textarea rows="4" bind:value={editShidouText}></textarea>

    <div class="modal-buttons">
      <button on:click={saveShidouEdit}>保存</button>
      <button class="cancel" on:click={() => showEditShidouModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showDeleteShidouModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3 style="color:red;">削除確認</h3>
    <p>この指導記録を削除しますか？</p>

    <div class="modal-buttons">
      <button class="danger" on:click={deleteShidou}>削除</button>
      <button class="cancel" on:click={() => showDeleteShidouModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showEditZemiModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3>ゼミ活動の編集</h3>

    <label>学年</label>
    <select bind:value={editZemiGrade}>
      <option value="1">1年</option>
      <option value="2">2年</option>
      <option value="3">3年</option>
    </select>

    <label>担当</label>
    <input type="text" bind:value={editZemiTeacher} />

    <label>内容</label>
    <textarea rows="4" bind:value={editZemiText}></textarea>

    <div class="modal-buttons">
      <button on:click={saveZemiEdit}>保存</button>
      <button class="cancel" on:click={() => showEditZemiModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showDeleteZemiModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3 style="color:red;">削除確認</h3>
    <p>このゼミ活動を削除しますか？</p>

    <div class="modal-buttons">
      <button class="danger" on:click={deleteZemi}>削除</button>
      <button class="cancel" on:click={() => showDeleteZemiModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showEditBukatsuModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3>部活動の編集</h3>

    <label>学年</label>
    <select bind:value={editBukatsuGrade}>
      <option value="1">1年</option>
      <option value="2">2年</option>
      <option value="3">3年</option>
    </select>

    <label>担当</label>
    <input type="text" bind:value={editBukatsuTeacher} />

    <label>内容</label>
    <textarea rows="4" bind:value={editBukatsuText}></textarea>

    <div class="modal-buttons">
      <button on:click={saveBukatsuEdit}>保存</button>
      <button class="cancel" on:click={() => showEditBukatsuModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showDeleteBukatsuModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3 style="color:red;">削除確認</h3>
    <p>この部活動記録を削除しますか？</p>

    <div class="modal-buttons">
      <button class="danger" on:click={deleteBukatsu}>削除</button>
      <button class="cancel" on:click={() => showDeleteBukatsuModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}


{#if showEditYakuinModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3>役員情報の編集</h3>

    <label>学年</label>
    <select bind:value={editYakuinGrade}>
      <option value="1">1年</option>
      <option value="2">2年</option>
      <option value="3">3年</option>
    </select>

    <label>担当</label>
    <input type="text" bind:value={editYakuinTeacher} />

    <label>内容</label>
    <textarea rows="4" bind:value={editYakuinText}></textarea>

    <div class="modal-buttons">
      <button on:click={saveYakuinEdit}>保存</button>
      <button class="cancel" on:click={() => showEditYakuinModal = false}>キャンセル</button>
    </div>
  </div>
</div>
{/if}

{#if showDeleteYakuinModal}
<div class="modal-backdrop">
  <div class="modal-box">
    <h3 style="color:red;">削除確認</h3>
    <p>この役員情報を削除しますか？</p>

    <div class="modal-buttons">
      <button class="danger" on:click={deleteYakuin}>削除</button>
      <button class="cancel" on:click={() => showDeleteYakuinModal = false}>キャンセル</button>
    </div>
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
    margin-bottom: 5px;
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

  .history-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .history-table th, 
  .history-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  .history-table th {
    background: #f0f0f0;
  }

  .photo-actions {
    margin-bottom: 20px;
  }

  .photo-actions button {
    margin-top: 2px;
    padding: 6px 12px;
  }

  .shidou-list {
  list-style: none;
  padding-left: 0;
  margin-bottom: 12px;
}

.shidou-list li {
  background: #fafafa;
  border: 1px solid #ddd;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
}

.modal {
  background: white;
  padding: 20px;
  width: 400px;
  max-height: 80vh;        /* impede de estourar a tela */
  overflow-y: auto;        /* ativa scroll interno */
  border-radius: 10px;
}

.guidance-item,
.note-item {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: #fafafa;
}

.guidance-item strong,
.note-item strong {
  display: inline-block;
  width: 60px;
}



  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .modal-box {
    background: white;
    padding: 20px;
    width: 400px;
    border-radius: 8px;
  }

  .modal-buttons {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }

  .cancel {
    background: #ccc;
  }

  .error {
    color: red;
    margin-top: 5px;
  }





</style>
