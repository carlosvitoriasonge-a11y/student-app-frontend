<script>
  console.log("COMPONENT INSTANCE:", Math.random());
  
    export const ssr = false;
  
    import { onMount } from "svelte";
    import { attendanceStore, parseClassId, formatClassLabel } from "$lib/stores/attendanceStore.js";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";
    import { tick } from "svelte";
  
    export let params;
  
    const course = params.course;
    const grade = params.grade;
    const className = params.className;
    const classId = `${course}-${grade}-${className}`;
    const { class_name } = parseClassId(classId);
    const classLabel = formatClassLabel({ course, grade, class_name });
  
    // -----------------------------
    // YEAR
    // -----------------------------
    let today = new Date().toLocaleDateString("sv-SE");
    let year = schoolYearFromDate(today);
  
    // -----------------------------
    // ALUNOS
    // -----------------------------
    let students = [];
  
    // 🔥 RESTAURADO — ESSENCIAL
    $: students = ($attendanceStore.studentsInfo || [])
      .filter(s => s.status !== "休学")
      .map(s => ({
        ...s,
        id: s.id.trim()
      }));
  
    // -----------------------------
    // SUBJECTS
    // -----------------------------
    let subjects = [];
    let subjectGroups = {};
    let selectedSubject = null;
    let showSubjectModal = false;
  
    let examFrequency = 1;
    let examKeys = [];
  
    const SUBJECT_ORDER = [
      "国語", "公民", "地理歴史", "数学", "理科",
      "英語", "保健体育", "芸術", "家庭", "情報", "総合探究"
    ];
  
    const examLabels = {
      zenki_chukan: "前期中間",
      zenki_kimatsu: "前期期末",
      koki_chukan: "後期中間",
      koki_kimatsu: "後期期末",
      single_exam: "単位認定考査"
    };
  
    function sortSubjects(list) {
      return [...list].sort((a, b) => {
        const aMain = SUBJECT_ORDER.indexOf(a.name);
        const bMain = SUBJECT_ORDER.indexOf(b.name);
        if (aMain !== bMain) return aMain - bMain;
        return a.subject_group.localeCompare(b.subject_group, "ja");
      });
    }
  
    async function openSubjectModal() {
      showSubjectModal = true;
  
      const res = await apiFetch(
        `/api/subjects?course=${course}&grade=${grade}`
      );
      const data = res?.json ? await res.json() : res;
  
      subjects = sortSubjects(Array.isArray(data) ? data : []);
  
      subjectGroups = {};
      for (const s of subjects) {
        if (!subjectGroups[s.name]) subjectGroups[s.name] = [];
        subjectGroups[s.name].push(s);
      }
    }
  
    function setupExamKeys() {
      if (Number(examFrequency) === 4) {
        examKeys = [
          "zenki_chukan",
          "zenki_kimatsu",
          "koki_chukan",
          "koki_kimatsu"
        ];
      } else {
        examKeys = ["single_exam"];
      }
    }
  
    async function selectSubject(s) {
      selectedSubject = s;
      examFrequency = Number(s.exam_frequency) || 1;
      setupExamKeys();
      showSubjectModal = false;
  
      await tick();
      loadExams();
    }
  
    // -----------------------------
    // EXAMS
    // -----------------------------
    let exams = {};
  
    async function loadExams() {
      if (!selectedSubject) return;
  
      const res = await apiFetch(
        `/api/exams/class/${course}/${grade}/${className}/${year}?subject_id=${selectedSubject.id}`
      );
  
      const data = res?.json ? await res.json() : res;
  
      console.log("EXAMS RAW:", JSON.stringify(data, null, 2));
  
      exams = data && typeof data === "object" ? data : {};
  
      console.log("EXAMS AFTER SET:", exams);
    }
  
    async function saveScore(examKey, studentId, score) {
      if (!selectedSubject) return;
  
      const payload = { score };

  
      await apiFetch(
        `/api/exams/class/${course}/${grade}/${className}/${year}/${selectedSubject.id}/${examKey}/${studentId}`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );
  
      exams = {
        ...exams,
        [examKey]: {
          ...(exams[examKey] || {}),
          [studentId]: Number(score)
        }
      };
    }

    function handleInput(e, examKey, studentId) {
    const raw = e.target.value.trim();

    // 🔥 Campo vazio → apagar do JSON
    if (raw === "") {
        saveScore(examKey, studentId, null);
        return;
    }

    // 🔥 Não-numérico → ignora
    if (!/^\d+$/.test(raw)) {
        e.target.value = exams[examKey]?.[studentId] ?? "";
        return;
    }

    // 🔥 Número válido
    saveScore(examKey, studentId, Number(raw));
}

  
    // -----------------------------
    // KEYBOARD NAVIGATION
    // -----------------------------
    let focusedRow = 0;
    let focusedCol = 0;
  
    onMount(() => {
  attendanceStore.loadStudents(classId);

  const handler = (e) => {
    if (!selectedSubject) return;

    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault(); // 🔥 impede o input de mudar o valor
    } else {
      return;
    }

    if (e.key === "ArrowDown") {
      focusedRow = Math.min(focusedRow + 1, students.length - 1);
    }
    if (e.key === "ArrowUp") {
      focusedRow = Math.max(focusedRow - 1, 0);
    }
    if (e.key === "ArrowRight") {
      focusedCol = Math.min(focusedCol + 1, examKeys.length - 1);
    }
    if (e.key === "ArrowLeft") {
      focusedCol = Math.max(focusedCol - 1, 0);
    }

    const id = `cell-${focusedRow}-${focusedCol}`;
    const el = document.getElementById(id);
    if (el) el.focus();
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
  });

  
  </script>
  
  <h1>試験管理</h1>
  
  <button on:click={openSubjectModal}>科目を選択</button>
  
  {#if showSubjectModal}
    <div class="modal">
      <div class="modal-content">
        <h2>科目を選択</h2>
        {#each Object.keys(subjectGroups) as name}
          <h3>{name}</h3>
          {#each subjectGroups[name] as s}
            <button on:click={() => selectSubject(s)}>{s.subject_group}</button>
          {/each}
        {/each}
        <button on:click={() => (showSubjectModal = false)}>閉じる</button>
      </div>
    </div>
  {/if}
  
  {#if selectedSubject}
    <h2>{selectedSubject.name}（{selectedSubject.subject_group}）</h2>
  
    {#if examKeys.length === 0}
      <p>この科目には試験がありません。</p>
    {:else}
      <div class="table-wrapper">
        <table class="exam-table">
          <thead>
            <tr>
              <th class="col-name">生徒名</th>
              {#each examKeys as key}
                <th class="col-exam">{examLabels[key]}</th>
              {/each}
            </tr>
          </thead>
  
          <tbody>
            {#each students as st, rowIndex}
              <tr>
                <td class="col-name">
                  <span class="att-no">{st.attend_no}</span>
                  {st.name}
                </td>
  
                {#each examKeys as key, colIndex}
                  <td class="col-exam">
                    <input
  id={`cell-${rowIndex}-${colIndex}`}
  type="text"
  inputmode="numeric"
  pattern="[0-9]*"
  value={exams[key]?.[st.id] ?? ""}
  on:input={(e) => handleInput(e, key, st.id)}
/>



                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
  
  <style>
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }
    .modal-content {
    background: white;
    padding: 16px;
    border-radius: 4px;
    min-width: 280px;

    max-height: 80vh;      /* 🔥 impede de ultrapassar a tela */
    overflow-y: auto;      /* 🔥 cria scroll interno */
}

  
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #ccc;
      margin-top: 15px;
    }
  
    .exam-table {
      border-collapse: collapse;
      min-width: max-content;
      background: white;
    }
  
    .col-name {
      position: sticky;
      left: 0;
      background: white;
      z-index: 10;
      min-width: 160px;
      font-weight: bold;
      border-right: 1px solid #ccc;
    }
  
    .att-no {
      display: inline-block;
      width: 28px;
      text-align: right;
      margin-right: 6px;
      color: #555;
      font-weight: normal;
    }
  
    .col-exam {
      min-width: 80px;
      text-align: center;
      padding: 4px;
    }
  
    table th,
    table td {
      padding: 4px 6px;
      background: white;
      border: 1px solid #ccc;
    }
  
    input[type="number"] {
      width: 70px;
      padding: 3px;
      text-align: center;
    }
  
    /* remove number arrows */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type="number"] {
      -moz-appearance: textfield;
    }
  </style>
  