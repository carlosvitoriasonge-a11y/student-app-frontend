<script lang="ts">
    export const ssr = false;
  
    import { onMount } from "svelte";
    import { attendanceStore } from "$lib/stores/attendanceStore.js";
    import { apiFetch } from "$lib/api.js";
  
    export let params;
  
    // ==========================
    // PARÂMETROS DA ROTA
    // ==========================
    const course = params.course;
    const grade = params.grade;
  
    // 学年集会: usamos ALL só para carregar todos os alunos do 学年
    const localClassId = `${course}-${grade}-ALL`;
  
    // ==========================
    // PERÍODOS
    // ==========================
    function getPeriodsForCourse(course: string) {
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
        { name: "５限目", start: "13:20", end: "14:10" },
        { name: "６限目", start: "14:15", end: "15:05" }
      ];
    }
  
    const PERIODS = getPeriodsForCourse(course);
  
    function detectCurrentPeriod(): string {
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
    // ESTADO GLOBAL
    // ==========================
    let attendance: any;
    let seats: any[] = [];
    let layoutRows = 12;
    let layoutCols = 7;
  
    let today = new Date().toLocaleDateString("sv-SE");
    let selectedPeriod = "";
    let subject = "";
    let examFrequency: number | null = null;
    let studentsStatus: Record<string, string> = {};
    let periodsData: any = {}; // classes[classId][date][period]
  
    let saveMessage = "";
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
  
    $: attendance = $attendanceStore;
  
    // ==========================
    // SEATING GAKUNEN
    // ==========================
    async function loadGakunenSeating() {
  const res = await apiFetch(
    `/api/students/seating?course=${course}&grade=${grade}&type=gakunen`
  );

  seats = res?.seats || [];

  // ⭐⭐⭐ INVERTER PARA TEACHER VIEW (igual ao HR) ⭐⭐⭐
  if (seats.length > 0) {
    const maxRow = Math.max(...seats.map((s: any) => Number(s.row)));
    const maxCol = Math.max(...seats.map((s: any) => Number(s.col)));

    seats = seats.map((s: any) => ({
      ...s,
      row: maxRow - (Number(s.row) - 1),
      col: maxCol - (Number(s.col) - 1)
    }));
  }

  // atualizar dimensões
  if (seats.length > 0) {
    layoutRows = Math.max(...seats.map((s: any) => Number(s.row))) || 12;
    layoutCols = Math.max(...seats.map((s: any) => Number(s.col))) || 7;
  } else {
    layoutRows = 12;
    layoutCols = 7;
  }
}

  
    function seatAt(r: number, c: number) {
      return (
        seats.find(
          (s: any) => Number(s.row) - 1 === r && Number(s.col) - 1 === c
        ) ?? null
      );
    }
  
    function getStudent(id: string | number | null) {
      const sid = String(id ?? "");
      return (attendance?.studentsInfo || []).find(
        (s: any) => sid === String(s.id ?? s.student_id)
      );
    }
  
    // ==========================
    // STATUS
    // ==========================
    const STATUS_ORDER = [
      "未記録",
      "出席",
      "欠席",
      "遅刻",
      "怠学・居眠り",
      "忘れ物"
    ];
  
    function statusColor(status: string) {
      switch (status) {
        case "未記録":
          return "#cccccc";
        case "出席":
          return "#A7F3D0";
        case "欠席":
          return "#FCA5A5";
        case "遅刻":
          return "#FDE68A";
        case "怠学・居眠り":
          return "#DC2626";
        case "忘れ物":
          return "#A97458";
        default:
          return "#E5E7EB";
      }
    }
  
    function statusTextColor() {
      return "#222";
    }
  
    function cycleStatus(current?: string) {
      const idx = STATUS_ORDER.indexOf(current ?? "未記録");
      return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    }
  
    function setStatus(studentId: string | number) {
      const sid = String(studentId);
      const next = cycleStatus(studentsStatus[sid] ?? "未記録");
      studentsStatus = { ...studentsStatus, [sid]: next };
    }
  
    // ==========================
    // FOTO / LONG PRESS
    // ==========================
    let timer: ReturnType<typeof setTimeout> | null = null;
    let longPressTriggered = false;
  
    function startLongPress(studentId: string | number | null) {
      if (!studentId) return;
      longPressTriggered = false;
      timer = setTimeout(() => {
        longPressTriggered = true;
        attendanceStore.showPhoto(String(studentId));
      }, 500);
    }
  
    function endLongPress() {
      if (timer) clearTimeout(timer);
      attendanceStore.hidePhoto();
    }
  
    $: photoStudent =
      attendance?.showPhoto ? getStudent(attendance.showPhoto) : null;
  
    // ==========================
    // MATÉRIAS
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
  
    let showSubjectModal = false;
    let subjects: any[] = [];
    let subjectGroups: Record<string, any[]> = {};
    let selectedName: string | null = null;
    let selectedSubject: any = null;
  
    function sortSubjects(list: any[]) {
      return [...list].sort((a, b) => {
        const aMain = SUBJECT_ORDER.indexOf(a.name);
        const bMain = SUBJECT_ORDER.indexOf(b.name);
        if (aMain !== bMain) return aMain - bMain;
        return a.subject_group.localeCompare(b.subject_group, "ja");
      });
    }
  
    async function openSubjectModal() {
      showSubjectModal = true;
      selectedName = null;
  
      const res = await apiFetch(
        `/api/subjects?course=${course}&grade=${grade}`
      );
      const data = res?.json ? await res.json() : res;
  
      subjects = sortSubjects(data || []);
  
      subjectGroups = {};
      for (const s of subjects) {
        if (!subjectGroups[s.name]) subjectGroups[s.name] = [];
        subjectGroups[s.name].push(s);
      }
    }
  
    function selectSubject(s: any) {
      selectedSubject = s;
      subject = s.subject_group;
      examFrequency = s.exam_frequency;
      selectedName = null;
      showSubjectModal = false;
    }

    function resolvePhoto(p: any): string {
  if (!p) return "/images/avatar-placeholder.png";

  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) {
    return `${p}?t=${Date.now()}`;
  }

  return `http://${window.location.hostname}:8000/photos/${p}?t=${Date.now()}`;
}


  
    // ==========================
    // LOAD POR CLASSE REAL
    // ==========================
    async function loadDay() {
    const res = await apiFetch(
      `/api/attendance_sub?date=${today}&course=${course}&grade=${grade}&class_name=ALL`
    );
  
      const allClasses = res?.classes || {};
      periodsData = allClasses;
  
      studentsStatus = {};
      subject = "";
      examFrequency = null;
  
      if (!selectedPeriod) {
        selectedPeriod = detectCurrentPeriod() || "";
      }
  
      if (!attendance?.studentsInfo || !selectedPeriod) return;
  
      for (const st of attendance.studentsInfo) {
        const classId = `${st.course}-${st.grade}-${st.class_name}`;
        const classData = allClasses[classId]?.[today];
        if (!classData) continue;
  
        const periodData = classData[selectedPeriod];
        if (!periodData) continue;
  
        if (!subject && periodData.subject) {
          subject = periodData.subject;
          examFrequency = periodData.exam_frequency ?? null;
        }
  
        if (periodData.students?.[st.id]) {
          studentsStatus[st.id] = periodData.students[st.id];
        }
      }
    }
  
    function onDateChange() {
      selectedPeriod = "";
      loadDay();
    }
  
    function onPeriodChange() {
      loadDay();
    }
  
    // ==========================
    // SALVAR POR CLASSE REAL
    // ==========================
    async function savePeriod() {
      if (!selectedPeriod) {
        alert("時限を選択してください。");
        return;
      }
      if (!selectedSubject) {
        alert("科目を選択してください。");
        return;
      }
  
      // Verificar conflito de aula já registrada
      if (attendance?.studentsInfo && Object.keys(periodsData).length > 0) {
        let conflict = false;
        let existingSubject: string | null = null;
  
        for (const st of attendance.studentsInfo) {
          const classId = `${st.course}-${st.grade}-${st.class_name}`;
          const classData = periodsData[classId]?.[today];
          if (!classData) continue;
  
          const periodData = classData[selectedPeriod];
          if (!periodData) continue;
  
          if (
            periodData.subject &&
            periodData.subject !== selectedSubject.subject_group
          ) {
            conflict = true;
            existingSubject = periodData.subject;
            break;
          }
        }
  
        if (conflict && existingSubject) {
          const ok = confirm(
            `⚠️ 既に別の授業「${existingSubject}」が登録されています。\n` +
              `上書きしてもよろしいですか？`
          );
          if (!ok) return;
        }
      }
  
      const grouped: Record<string, Record<string, string>> = {};
  
      for (const [sid, status] of Object.entries(studentsStatus)) {
        const st = getStudent(sid);
        if (!st) continue;
  
        const classId = `${st.course}-${st.grade}-${st.class_name}`;
        if (!grouped[classId]) grouped[classId] = {};
        grouped[classId][sid] = status;
      }
  
      const payload: any = {
        date: today,
        period: selectedPeriod,
        subject: selectedSubject.subject_group,
        subject_id: selectedSubject.id,
        exam_frequency: examFrequency,
        classes: {}
      };
  
      for (const classId of Object.keys(grouped)) {
        payload.classes[classId] = {
          students: grouped[classId]
        };
      }
  
      await apiFetch("/api/attendance_sub/save", {
        method: "POST",
        body: JSON.stringify(payload)
      });
  
      saveMessage = "保存しました。";
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => (saveMessage = ""), 1500);
  
      await loadDay();
    }
  
    // ==========================
    // INIT
    // ==========================
    async function init() {
      await attendanceStore.loadStudents(localClassId);
      await loadGakunenSeating();
      await loadDay();
    }


  function toggleAll() {
  const list = attendance?.studentsInfo ?? [];
  const currentMap = studentsStatus || {};
  const updated = { ...currentMap };

  for (const st of list) {
    const sid = String(st.id ?? st.student_id);
    const current = updated[sid] ?? "未記録";
    updated[sid] = cycleStatus(current);
  }

  studentsStatus = updated;
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
      line-height: 1;
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
  
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
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
      max-height: 60vh;
      padding-right: 6px;
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
  
    .grid,
    .grid *,
    .seat,
    .seat *,
    .student-item,
    .student-item * {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: manipulation;
    }
  
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  
    * {
      -webkit-touch-callout: none;
    }


.bulk-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.bulk-buttons button {
    padding: 6px 12px;
    font-size: 14px;
}



.bulk-buttons button { background: #04ff00;  margin-left: 1rem; }
  .bulk-buttons button:hover { background: #005711; }
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
      
      <div class="header-info">
        <span class="subtitle">{course} {grade}年 学年集会</span>
        {#if saveMessage}
          <div class="save-feedback">{saveMessage}</div>
        {/if}
        <button class="save-btn" on:click={savePeriod}>保存</button>
      </div>
      </div>
      <div class="bulk-buttons">
        <button on:click={toggleAll}>全員 切替</button>
      
      
      </div>
      
      <div class="page">
        <div class="main-area">
          {#if seats && seats.length > 0}
            <div
              class="grid"
              style={`--cols: ${layoutCols}; grid-auto-rows: minmax(70px,auto);`}
            >
              {#each Array(layoutRows) as _, r}
                {#each Array(layoutCols) as _, c}
                  {@const seat = seatAt(r, c)}
                  <div style={`grid-column: ${c + 1}; grid-row: ${r + 1};`}>
                    {#if seat}
                      {#if seat.student_id && getStudent(seat.student_id)?.status !== "休学"}
                        <div
                          class="seat"
                          style="
                            background-color: {statusColor(studentsStatus[String(seat.student_id)] ?? '未記録')};
                            color: {statusTextColor()};
                          "
                          on:click={() => {
                            if (!longPressTriggered) setStatus(String(seat.student_id));
                          }}
                          on:pointerdown={() => startLongPress(String(seat.student_id))}
                          on:pointerup={endLongPress}
                          on:pointerleave={endLongPress}
                        >
                          {#if getStudent(seat.student_id)}
                            <div class="seat-name">
                              {getStudent(seat.student_id).name}
                            </div>
                            <div class="seat-kana">
                              {getStudent(seat.student_id).kana}
                            </div>
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
      
            <div class="teacher-desk">教卓</div>
          {:else}
            <p>座席が読み込まれていません。</p>
          {/if}
        </div>
      
        <aside class="aside-area">
          <h2>生徒一覧</h2>
      
          {#if attendance?.studentsInfo && attendance.studentsInfo.length > 0}
            <ul class="student-list">
              {#each attendance.studentsInfo.filter((s: any) => s.status !== "休学") as student}
                {@const sid = String(student.id ?? student.student_id ?? "")}
                {@const allocated = seats.some(
                  (seat: any) => String(seat?.student_id ?? "") === sid
                )}
      
                <li
                  class="student-item"
                  style="
                    opacity: {allocated ? 0.9 : 1};
                    cursor: pointer;
                    background-color: {statusColor(studentsStatus[sid] ?? '未記録')};
                    color: {statusTextColor()};
                  "
                  on:click={() => {
                    if (!longPressTriggered) setStatus(sid);
                  }}
                  on:pointerdown={() => startLongPress(sid)}
                  on:pointerup={endLongPress}
                  on:pointerleave={endLongPress}
                >
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div style="font-weight:600;">
                        {student.attend_no}番 {student.name}
                      </div>
                      <div style="font-size:12px; color:#666">{student.kana}</div>
                    </div>
      
                    <div style="text-align:right; min-width:84px;">
                      <div style="font-size:12px; color:#222">
                        {studentsStatus[sid] ?? "未記録"}
                      </div>
                      {#if allocated}
                        <div style="margin-top:6px; font-size:12px; color:#444">
                          割当済
                        </div>
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
          <img
            src={resolvePhoto(photoStudent.photo ?? photoStudent.avatar ?? photoStudent.image)}
            alt={photoStudent?.name ?? "photo"}
            on:error={(e) => {
              const target = e.currentTarget;
              if (target instanceof HTMLImageElement) {
                target.onerror = null;
                target.src = "/images/avatar-placeholder.png";
              }
            }}
            width="180"
            height="180"
            style="object-fit:cover; border-radius:6px;"
          />
      
          <div style="margin-top:8px; font-weight:600;">{photoStudent.name}</div>
          <div style="font-size: 12px; color: #555">{photoStudent.kana}</div>
        </div>
      {/if}
      
      {#if showSubjectModal}
        <div
          class="modal-backdrop"
          on:click={() => {
            showSubjectModal = false;
            selectedName = null;
          }}
        ></div>
      
        <div class="modal">
          <h2>教科を選択</h2>
      
          <div class="modal-scroll">
            {#if !selectedName}
              <ul class="subject-list">
                {#each Object.keys(subjectGroups) as name}
                  <li class="subject-item" on:click={() => (selectedName = name)}>
                    {name}
                  </li>
                {/each}
              </ul>
            {/if}
      
            {#if selectedName}
              <h3>{selectedName} の科目</h3>
      
              <ul class="subject-list">
                {#each subjectGroups[selectedName] as s}
                  <li class="subject-item" on:click={() => selectSubject(s)}>
                    {s.subject_group}
                  </li>
                {/each}
              </ul>
      
              <button on:click={() => (selectedName = null)}>戻る</button>
            {/if}
          </div>
      
          <button
            class="close-btn"
            on:click={() => {
              showSubjectModal = false;
              selectedName = null;
            }}
          >
            閉じる
          </button>
        </div>
      {/if}
      