<script>
  export const ssr = false;

  import { onMount } from "svelte";
  import { attendanceStore, parseClassId, formatClassLabel } from "$lib/stores/attendanceStore.js";
  import { apiFetch } from "$lib/api.js";
  import { attendanceSubStore } from "$lib/stores/attendanceSubStore.js";

  export let params;

  // ==========================
  // PARÂMETROS DA ROTA
  // ==========================
  const course = params.course;
  const grade = params.grade;
  const className = params.className;

  const localClassId = `${course}-${grade}-${className}`;
  const { class_name } = parseClassId(localClassId);
  const classLabel = formatClassLabel({ course, grade, class_name });

  // ==========================
  // ESTADO GLOBAL
  // ==========================
  let attendance;
  let sub;
  let gridKey;
  let saveMessage = "";
  let saveTimer = null;

  $: attendance = $attendanceStore;
  $: sub = $attendanceSubStore;

  $: gridKey = sub?.layout + "-" + JSON.stringify(sub?.seats);
  $: console.log("SEATING SUB:", sub?.seats);

  const defaultRows = 5;
  const defaultCols = 6;

  let layoutRows = defaultRows;
  let layoutCols = defaultCols;

  $: {
    if (sub?.seats && sub.seats.length > 0) {
      layoutRows = Math.max(...sub.seats.map(s => Number(s.row))) || defaultRows;
      layoutCols = Math.max(...sub.seats.map(s => Number(s.col))) || defaultCols;
    } else {
      layoutRows = defaultRows;
      layoutCols = defaultCols;
    }
  }

  // ==========================
  // DATA / PERÍODO / SUBJECT
  // ==========================
  let today = new Date().toLocaleDateString("sv-SE");
  let selectedPeriod = "";
  let subject = "";

  // ==========================
  // SUBJECT MODAL
  // ==========================
  let showSubjectModal = false;
  let subjects = [];
  let subjectGroups = {};
  let selectedName = null;

  // periodsData: { "１限目": { subject, students: { id: status } } }
  let periodsData = {};
  let studentsStatus = {};

  // ==========================
  // DEFINIÇÃO DE PERÍODOS
  // ==========================
  function getPeriodsForCourse(course) {
      if (course === "水") {
          return [
              { name: "１限目", start: "16:10", end: "17:05" },
              { name: "２限目", start: "17:10", end: "18:05" },
              { name: "３限目", start: "18:10", end: "19:05" }
          ];
      }

      return [
          { name: "１限目", start: "09:15", end: "10:05" },
          { name: "２限目", start: "10:10", end: "11:00" },
          { name: "３限目", start: "11:05", end: "11:55" },
          { name: "４限目", start: "12:00", end: "12:55" },
          { name: "５限目", start: "13:20", end: "14:010" },
          { name: "６限目", start: "14:15", end: "15:05" }
      ];
  }

  const PERIODS = getPeriodsForCourse(course);

  function detectCurrentPeriod() {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();

      for (const p of PERIODS) {
          const [sh, sm] = p.start.split(":").map(Number);
          const [eh, em] = p.end.split(":").map(Number);

          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;

          if (current >= startMin && current <= endMin) {
              return p.name;
          }
      }

      return "";
  }

  // ==========================
  // LONG PRESS / FOTO
  // ==========================
  let timer = null;
  let longPressTriggered = false;

  function startLongPress(studentId) {
    if (!studentId) return;
    longPressTriggered = false;
    timer = setTimeout(() => {
      longPressTriggered = true;
      attendanceStore.showPhoto(String(studentId));
    }, 500);
  }

  function endLongPress() {
    clearTimeout(timer);
    if (longPressTriggered) {
      setTimeout(() => {
        longPressTriggered = false;
        attendanceStore.hidePhoto();
      }, 100);
    } else {
      attendanceStore.hidePhoto();
    }
  }

  function getStudent(id) {
    const sid = String(id ?? "");
    return (attendance?.studentsInfo || []).find(
      s => sid === String(s.id ?? s.student_id)
    );
  }

  $: photoStudent =
    attendance?.showPhoto
      ? getStudent(attendance.showPhoto)
      : null;

  // ==========================
  // STATUS / CORES
  // ==========================
  const STATUS_ORDER = [
    "未記録",
    "出席",
    "欠席",
    "遅刻",
    "怠学・居眠り",
    "忘れ物"
  ];

  function statusColor(status) {
    switch (status) {
      case "未記録": return "#cccccc";
      case "出席": return "#A7F3D0";
      case "欠席": return "#FCA5A5";
      case "遅刻": return "#FDE68A";
      case "怠学・居眠り": return "#DC2626";
      case "忘れ物": return "#A97458";
      default: return "#E5E7EB";
    }
  }

  function statusTextColor(status) {
    return "#222";
  }

  function cycleStatus(current) {
    const idx = STATUS_ORDER.indexOf(current ?? "未記録");
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    return next;
  }

  function setStatus(studentId) {
    const sid = String(studentId);
    const current = studentsStatus[sid] ?? "未記録";
    const next = cycleStatus(current);
    studentsStatus = { ...studentsStatus, [sid]: next };
  }

  // ==========================
  // GRID / SEATING
  // ==========================
  function seatAt(r, c) {
    const seats = sub?.seats || [];
    const found = seats.find(
      s => Number(s.row) - 1 === r && Number(s.col) - 1 === c
    );
    return found ?? null;
  }

  // ==========================
  // CARREGAR DADOS DO DIA
  // ==========================
  async function loadDay() {
    const res = await apiFetch(
      `/api/attendance_sub?date=${today}&course=${encodeURIComponent(course)}&grade=${encodeURIComponent(
        grade
      )}&class_name=${encodeURIComponent(className)}`
    );

    const classId = `${course}-${grade}-${className}`;
    const dayData = res?.classes?.[classId]?.[today] || {};

    periodsData = dayData;

    if (selectedPeriod && periodsData[selectedPeriod]) {
      subject = periodsData[selectedPeriod].subject || "";
      studentsStatus = { ...(periodsData[selectedPeriod].students || {}) };
    } else {
      const todayStr = new Date().toLocaleDateString("sv-SE");
      if (today === todayStr) {
        const autoPeriod = detectCurrentPeriod();
        if (autoPeriod) {
          selectedPeriod = autoPeriod;
        }
      }

      if (selectedPeriod && periodsData[selectedPeriod]) {
        subject = periodsData[selectedPeriod].subject || "";
        studentsStatus = { ...(periodsData[selectedPeriod].students || {}) };
      } else {
        subject = "";
        studentsStatus = {};
      }
    }
  }

  function onDateChange() {
    loadDay();
  }

  function onPeriodChange() {
    if (selectedPeriod && periodsData[selectedPeriod]) {
      subject = periodsData[selectedPeriod].subject || "";
      studentsStatus = { ...(periodsData[selectedPeriod].students || {}) };
    } else {
      subject = "";
      studentsStatus = {};
    }
  }

  // ==========================
  // SALVAR PERÍODO
  // ==========================
  async function savePeriod() {
    if (!selectedPeriod) {
      alert("時限を選択してください。");
      return;
    }
    if (!subject) {
      alert("科目を入力してください。");
      return;
    }

    const payload = {
      date: today,
      period: selectedPeriod,
      subject,
      classes: {
        [`${course}-${grade}-${className}`]: {
          students: studentsStatus
        }
      }
    };

    await apiFetch("/api/attendance_sub/save", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveMessage = "保存しました。";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveMessage = "", 1500);

    await loadDay();
  }

  // ==========================
  // INIT
  // ==========================
  async function init() {
    await attendanceStore.loadStudents(localClassId);

    let preferred = "auto";
    try {
      const prefRes = await apiFetch(
        `/api/seating/preference?course=${course}&grade=${grade}&class_name=${className}`
      );
      const pref = prefRes?.json ? await prefRes.json() : prefRes;
      if (["auto", "custom", "A", "B", "C"].includes(pref?.preferred_layout)) {
        preferred = pref.preferred_layout;
      }
    } catch {}

    await attendanceSubStore.loadSeatingMaps(localClassId, preferred);

    await loadDay();
  }

  // ==========================
  // ORDEM DE MATÉRIAS (REUTILIZADA)
  // ==========================
  const SUBJECT_ORDER = [
    "国語",
    "公民",
    "地理歴史",
    "数学",
    "理科",
    "英語",
    "保健体育",
    "芸術",
    "家庭",
    "情報",
    "総合探究"
  ];

  function sortSubjects(list) {
    return [...list].sort((a, b) => {
      const aMain = SUBJECT_ORDER.indexOf(a.name);
      const bMain = SUBJECT_ORDER.indexOf(b.name);

      if (aMain !== bMain) return aMain - bMain;

      return a.subject_group.localeCompare(b.subject_group, "ja");
    });
  }

  // ==========================
  // MODAL DE MATÉRIAS
  // ==========================
  async function openSubjectModal() {
    showSubjectModal = true;
    selectedName = null;

    const res = await apiFetch(
      `/api/subjects?course=${course}&grade=${grade}`
    );

    const data = res?.json ? await res.json() : res;

    subjects = Array.isArray(data) ? data : [];

    // ORDENAR AQUI
    subjects = sortSubjects(subjects);

    // AGRUPAR POR name
    subjectGroups = {};
    for (const s of subjects) {
      if (!subjectGroups[s.name]) subjectGroups[s.name] = [];
      subjectGroups[s.name].push(s);
    }
  }

  function selectSubject(s) {
    subject = s.subject_group;
    selectedName = null;
    showSubjectModal = false;
  }
  
    onMount(init);
  </script>
  
  <style>
    .page {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      height: 100vh;
      overflow: visible;
    }
    .main-area {
      flex: 0 0 auto;
      height: 100%;
      overflow-y: auto;
      max-width: 1000px;
    }
    .aside-area {
      width: 250px;
      max-width: 35%;
      min-width: 240px;
      border-left: 1px solid #eee;
      padding-left: 16px;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
    }
    .grid {
      display: grid;
      gap: 6px;
      margin-top: 16px;
      grid-template-columns: repeat(var(--cols), minmax(70px, 1fr));
      grid-auto-rows: 70px;
      align-items: stretch;
    }
    .seat {
      max-height: 100px;
      min-height: 110px;
      min-width: 100px;
      max-width: 100px;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-radius: 6px;
      text-align: center;
      overflow: hidden;
    }
    .inactive {
      background: #ddd;
      color: #666;
    }
    .teacher-desk {
      margin-top: 12px;
      font-weight: 700;
      text-align: center;
    }
    .student-list {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .student-item {
      padding: 8px;
      border-radius: 6px;
      background: #fafafa;
      border: 1px solid #eee;
    }
    .seat-name {
      line-height: 1.05;
      word-break: break-word;
      overflow: hidden;
      font-size: clamp(0.45rem, 3cqw, 0.85rem);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .seat-kana {
      font-size: 12px;
      color: #555;
      line-height: 1.0;
      margin-top: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      flex-wrap: nowrap;
      white-space: nowrap;
    }
    .header-info {
      font-size: 0.9rem;
      color: #444;
    }

    .layout-switch {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.layout-switch button 
  
  
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 900;
}

.modal { 
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: white; 
  padding: 20px; 
  border-radius: 10px; 
  width: 90%;
  max-width: 400px; 
  max-height: 80vh;
  display: flex; 
  flex-direction: column; 
  z-index: 901;
}


.modal-scroll { 
  overflow-y: auto; 
  margin-top: 10px; 
  margin-bottom: 10px; 
  max-height: 60vh; /* área rolável */ 
  padding-right: 6px; /* espaço pro scroll */
}

.subject-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}

.subject-item {
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
}

.subject-item:hover {
  background: #f0f0f0;
}

.close-btn {
  margin-top: 12px;
  width: 100%;
}


.save-feedback {
  background: #4ade80;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-right: 12px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}


  </style>
  
  <div class="header-row">
    <label>
      日付
      <input type="date" bind:value={today} on:change={onDateChange} />
    </label>
  
    <label>
      時限
      <select bind:value={selectedPeriod} on:change={onPeriodChange}>
        <option value="">選択してください</option>
        {#each PERIODS as p}
          <option value={p.name}>{p.name}</option>
        {/each}
      </select>
    </label>
  
    <label>
      科目
      <input
        bind:value={subject}
        placeholder="科目を選択"
        readonly
        on:click={openSubjectModal}
      />

    </label>
  
    <!-- TROCA DE MAPA (igual HR) -->
    <div class="layout-switch">
      <button on:click={() => attendanceSubStore.setLayout("auto")} disabled={$attendanceSubStore.layout === "auto"}>出席番号順</button>
      <button on:click={() => attendanceSubStore.setLayout("custom")} disabled={$attendanceSubStore.layout === "custom"}>カスタム</button>
      <button on:click={() => attendanceSubStore.setLayout("A")} disabled={$attendanceSubStore.layout === "A"}>A</button>
      <button on:click={() => attendanceSubStore.setLayout("B")} disabled={$attendanceSubStore.layout === "B"}>B</button>
      <button on:click={() => attendanceSubStore.setLayout("C")} disabled={$attendanceSubStore.layout === "C"}>C</button>
    </div>
    
  
    <div class="header-info">
      <span class="subtitle">{classLabel}</span>
      {#if saveMessage}
        <div class="save-feedback">{saveMessage}</div>
      {/if}
      <button class="save-btn" on:click={savePeriod}>保存</button>
    </div>
  </div>
  
  
  <div class="page">
    <div class="main-area">
      {#if sub?.seats && sub.seats.length > 0}
      {#key gridKey}
      <div
        class="grid"
        style={`--cols: ${layoutCols}; grid-auto-rows: minmax(70px,auto);`}
      >
    
          {#each Array(layoutRows) as _, r}
            {#each Array(layoutCols) as _, c}
              {@const seat= seatAt(r, c)}
              <div style={`grid-column: ${c + 1}; grid-row: ${r + 1};`}>
                {#if seat !== null}
                  {#if seat?.student_id && getStudent(seat.student_id)?.status !== "休学"}
                    <div
                      class="seat"
                      style="
                        background-color: {statusColor(studentsStatus[String(seat.student_id)] ?? '未記録')};
                        color: {statusTextColor(studentsStatus[String(seat.student_id)] ?? '未記録')};
                      "
                      on:click={() => { if (!longPressTriggered) setStatus(seat.student_id); }}
                      on:pointerdown={() => startLongPress(seat.student_id)}
                      on:pointerup={endLongPress}
                      on:pointerleave={endLongPress}
                    >
                      {#if getStudent(seat.student_id)}
                        <div class="seat-name">{getStudent(seat.student_id).name}</div>
                        <div class="seat-kana">{getStudent(seat.student_id).kana}</div>
                      {/if}
                      <div style="margin-top:6px; font-size:13px;">
                        {studentsStatus[String(seat.student_id)] ?? "未記録"}
                      </div>
                    </div>
                  {:else}
                    <div class="seat inactive">
                      <div class="seat-name">空席</div>
                    </div>
                  {/if}
                {:else}
                  <div class="seat inactive">
                    <div class="seat-name">×</div>
                  </div>
                {/if}
              </div>
            {/each}
          {/each}
        </div>

        {/key}
  
        <div class="teacher-desk">教卓</div>
      {:else}
        <p>座席が読み込まれていません。</p>
      {/if}
    </div>
  
    <aside class="aside-area">
      <h2>生徒一覧</h2>
  
      {#if attendance?.studentsInfo && attendance.studentsInfo.length > 0}
        <ul class="student-list">
          {#each attendance.studentsInfo.filter(s => s.status !== "休学") as student}
            {@const sid = String(student.id ?? student.student_id ?? "")}
            {@const allocated = (attendance?.seats || []).some(seat => String(seat?.student_id ?? "") === sid)}
  
            <li
              class="student-item"
              style="
                opacity: {allocated ? 0.9 : 1};
                cursor: pointer;
                background-color: {statusColor(studentsStatus[sid] ?? '未記録')};
                color: {statusTextColor(studentsStatus[sid] ?? '未記録')};
              "
              on:click={() => { if (!longPressTriggered) setStatus(sid); }}
              on:pointerdown={() => startLongPress(sid)}
              on:pointerup={endLongPress}
              on:pointerleave={endLongPress}
            >
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:600;">{student.attend_no}番 {student.name}</div>
                  <div style="font-size:12px; color:#666">{student.kana}</div>
                </div>
  
                <div style="text-align:right; min-width:84px;">
                  <div style="font-size:12px; color:#222">
                    {studentsStatus[sid] ?? "未記録"}
                  </div>
                  {#if allocated}
                    <div style="margin-top:6px; font-size:12px; color:#444">割当済</div>
                  {/if}
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p>読み込み中...</p>
      {/if}
    </aside>
  </div>
  
  {#if photoStudent}
    <div
      class="photo-bubble"
      style="
        position: absolute;
        top: 20%;
        left: 50%;
        background: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 999;
        text-align: center;
        pointer-events:none;
      "
    >
      {#if (photoStudent.photo ?? photoStudent.avatar ?? photoStudent.image)}
        <img
          src={
            (() => {
              const p = (photoStudent.photo ?? photoStudent.avatar ?? photoStudent.image);
              if (typeof p !== "string") return "/images/avatar-placeholder.png";
              if (p.startsWith("http://") || p.startsWith("https://")) return `${p}?t=${Date.now()}`;
              return `http://${window.location.hostname}:8000/photos/${p}?t=${Date.now()}`;
            })()
          }
          alt={photoStudent?.name ?? "photo"}
          on:error={(e) => { e.target.onerror = null; e.target.src = "/images/avatar-placeholder.png"; }}
          width="180"
          height="180"
          style="object-fit:cover; border-radius:6px;"
        />
      {:else}
        <div class="no-photo-text">写真が登録されていません。</div>
      {/if}
  
      <div style="margin-top:8px; font-weight:600;">{photoStudent.name}</div>
      <div style="font-size: 12px; color: #555">{photoStudent.kana}</div>
    </div>
  {/if}


    {#if showSubjectModal}
  <div class="modal-backdrop" on:click={() => { showSubjectModal = false; selectedName = null; }}></div>

  <div class="modal">
    <h2>教科を選択</h2>

    <!-- PRIMEIRO NÍVEL: nomes únicos -->
    <div class="modal-scroll">
    {#if !selectedName}
      <ul class="subject-list">
        {#each Object.keys(subjectGroups) as name}
          <li class="subject-item" on:click={() => selectedName = name}>
            {name}
          </li>
        {/each}
      </ul>
    {/if}

    <!-- SEGUNDO NÍVEL: subject_group -->
    {#if selectedName}
      <h3>{selectedName} の科目</h3>

      <ul class="subject-list">
        {#each subjectGroups[selectedName] as s}
          <li class="subject-item" on:click={() => selectSubject(s)}>
            {s.subject_group}
          </li>
        {/each}
      </ul>

      <button on:click={() => selectedName = null}>戻る</button>
    {/if}
  </div>

    <button class="close-btn" on:click={() => { showSubjectModal = false; selectedName = null; }}>閉じる</button>
  </div>
{/if}

