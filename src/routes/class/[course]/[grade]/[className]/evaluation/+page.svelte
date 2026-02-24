<script>
    export const ssr = false;
  
    import { onMount, tick } from "svelte";
    import { attendanceStore, parseClassId, formatClassLabel } from "$lib/stores/attendanceStore.js";
    import { apiFetch } from "$lib/api.js";
    import { schoolYearFromDate } from "$lib/utils/date.js";
  
    export let params;
  
    const course = params.course;
    const grade = params.grade;
    const className = params.className;
    const classId = `${course}-${grade}-${className}`;
    const { class_name } = parseClassId(classId);
    const classLabel = formatClassLabel({ course, grade, class_name });
  
    let today = new Date().toLocaleDateString("sv-SE");
    let year = schoolYearFromDate(today);
  
    let students = [];
  
    $: students = ($attendanceStore.studentsInfo || [])
      .filter(s => s.status !== "休学")
      .map(s => ({
        ...s,
        id: String(s.id).trim()
      }));
  
    let subjects = [];
    let subjectGroups = {};
    let selectedSubject = null;
    let showSubjectModal = false;
  
    const SUBJECT_ORDER = [
      "国語", "公民", "地理歴史", "数学", "理科",
      "英語", "保健体育", "芸術", "家庭", "情報", "総合探究"
    ];
  
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
  
      const res = await apiFetch(`/api/subjects?course=${course}&grade=${grade}`);
      const data = res?.json ? await res.json() : res;
  
      subjects = sortSubjects(Array.isArray(data) ? data : []);
  
      subjectGroups = {};
      for (const s of subjects) {
        if (!subjectGroups[s.name]) subjectGroups[s.name] = [];
        subjectGroups[s.name].push(s);
      }
    }
  
    async function selectSubject(s) {
      selectedSubject = s;
      showSubjectModal = false;
  
      await tick();
      loadEvaluation();
    }
  
    let evaluation = {};
  
    async function loadEvaluation() {
      if (!selectedSubject) return;
  
      const res = await apiFetch(
        `/api/evaluation/class?course=${course}&grade=${grade}&class_name=${className}&subject=${selectedSubject.id}`
      );
  
      const data = res?.json ? await res.json() : res;
  
      evaluation = data && typeof data === "object" ? data : {};
    }
  
    // ⭐ 保存 geral
    async function saveAllFinalGrades() {
      const payload = {
        course,
        grade,
        class_name: className,
        subject: selectedSubject.id,
        evaluations: {}
      };
  
      for (const st of students) {
        const ev = evaluation[st.id];
        if (!ev) continue;
  
        payload.evaluations[st.id] = {
          evaluation: Number(ev.final_grade ?? 0),
          kanten: ev.continuous?.kanten ?? null
        };
      }
  
      await apiFetch("/api/evaluation_save_all", {
        method: "POST",
        body: JSON.stringify(payload)
      });
  
      await loadEvaluation();
    }
  
    onMount(() => {
      attendanceStore.loadStudents(classId);
    });
  </script>
  
  <h1>評価管理 — {classLabel}</h1>
  
  <button on:click={openSubjectModal}>科目を選択</button>
  
  {#if showSubjectModal}
    <div class="modal">
      <div class="modal-content">
        <h2>科目を選択</h2>
  
        {#each Object.keys(subjectGroups) as name}
          <h3>{name}</h3>
          {#each subjectGroups[name] as s}
            <button on:click={() => selectSubject(s)}>
              {s.subject_group}
            </button>
          {/each}
        {/each}
  
        <button on:click={() => (showSubjectModal = false)}>閉じる</button>
      </div>
    </div>
  {/if}
  
  {#if selectedSubject}
    <h2>{selectedSubject.name}（{selectedSubject.subject_group}）</h2>
  
    {#if Object.keys(evaluation).length === 0}
      <p>データがありません。</p>
    {:else}
      <div class="table-wrapper">
        <table class="eval-table">
          <thead>
            <tr>
              <th class="col-name">生徒名</th>
              <th>暫定評価</th>
              <th>観点別</th>
              <th>最終評価</th>
            </tr>
          </thead>
  
          <tbody>
            {#each students as st}
              <tr>
                <td class="col-name">
                  <span class="att-no">{st.attend_no}</span>
                  {st.name}
                </td>
  
                <!-- 暫定評価 -->
                <td>{evaluation[st.id]?.continuous?.five_scale ?? "-"}</td>
  
                <!-- 観点別 -->
                <td>{evaluation[st.id]?.continuous?.kanten ?? "-"}</td>
  
                <!-- 最終評価 (editable) -->
                <td>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    bind:value={evaluation[st.id].final_grade}
                    class="final-input"
                  />
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
  
      <div class="actions">
        <button on:click={saveAllFinalGrades}>保存</button>
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
    }
  
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #ccc;
      margin-top: 15px;
    }
  
    .eval-table {
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
  
    table th,
    table td {
      padding: 4px 6px;
      background: white;
      border: 1px solid #ccc;
      text-align: center;
    }
  
    .final-input {
      width: 45px;
      text-align: center;
      font-size: 1rem;
    }
  
    .actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
  </style>
  