<script>
    export const ssr = false;
  
    import { onMount, tick } from "svelte";
    import { apiFetch } from "$lib/api.js";
    import { parseClassId, formatClassLabel } from "$lib/stores/attendanceStore.js";
  
    export let params;
  
    const course = params.course;
    const grade = params.grade;
    const className = params.className;
    const classId = `${course}-${grade}-${className}`;
    const { class_name } = parseClassId(classId);
    const classLabel = formatClassLabel({ course, grade, class_name });
  
    let students = [];
    let subjects = [];
    let evaluations = null;
    let attendance = null;
  
    let snapshotMessage = "";   // ← mensagem visual
  
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
  
    onMount(async () => {
      students = await apiFetch(
        `/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`
      );
  
      students = students
        .filter(s => s.status !== "休学")   // <<<<<<<<<< AQUI
        .map(s => ({ ...s, attend_no: Number(s.attend_no) }))
        .sort((a, b) => a.attend_no - b.attend_no);
  
      const resSubjects = await apiFetch(
        `/api/subjects?course=${course}&grade=${grade}`
      );
      subjects = sortSubjects(resSubjects);
  
      evaluations = {};

      for (const subj of subjects) {
        evaluations[subj.id] = await apiFetch(
          `/api/evaluation/class?course=${course}&grade=${grade}&class_name=${className}&subject=${subj.id}`
        );
      }

  
      const thisYear = new Date().getFullYear();
      const sy = thisYear - 1;
  
      attendance = await apiFetch(
        `/api/attendance_hr_boletin/hr?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`
      );
  
      await tick();
    });
  
    async function saveSnapshot() {
      for (const subj of subjects) {
        const url = `/api/evaluation/confirm-semester?course=${course}&grade=${grade}&class_name=${className}&subject=${subj.id}&semester=1`;
  
        await apiFetch(url, {
          method: "POST",
          body: {}
        });
      }
  
      const newEval = await apiFetch(
  `/api/evaluation/class/all?course=${course}&grade=${grade}&class_name=${className}`
);

evaluations = null; await tick(); evaluations = structuredClone(newEval); await tick();


  
      snapshotMessage = "前期スナップショットを保存しました！";  // ← mensagem aparece
      setTimeout(() => snapshotMessage = "", 2000);             // ← some depois de 2s
  
    
    }
  
    function getFive(subjectId, studentId) {
      const ev = evaluations?.[subjectId]?.[studentId];
      return ev?.zenki_snapshot?.five_scale ?? "-";
    }
  
    function getKanten(subjectId, studentId) {
      const ev = evaluations?.[subjectId]?.[studentId];
      return ev?.zenki_snapshot?.kanten ?? "-";
    }
  </script>
  
  
  
  <h1>通知表（前期） — {classLabel}</h1>
  
  <button on:click={saveSnapshot}>前期スナップショットを保存する</button>
  {#if snapshotMessage}
  <div class="snapshot-msg">{snapshotMessage}</div>
  {/if}

  
  <div class="table-wrapper">
    <table class="report-table">
      <thead>
        <tr>
          <th>番号</th>
          <th>名前</th>
  
          {#each subjects.filter(s => s.exam_frequency && Number(s.exam_frequency) > 0) as subj}
          <th class="vertical-header">{subj.subject_group}<br>（５段階）</th>
          <th class="vertical-header">{subj.subject_group}<br>（観点）</th>
          
          {/each}
  
          <th class="vertical-header">出席</th>
          <th class="vertical-header">欠席</th>
          <th class="vertical-header">遅刻</th>
          <th class="vertical-header">早退</th>
          <th class="vertical-header">忌引</th>
          <th class="vertical-header">出停</th>
          <th class="vertical-header">公欠</th>
          <th class="vertical-header">出席率</th>
        </tr>
      </thead>
  
      <tbody>
        {#if !evaluations || !attendance}
          <tr><td colspan="999">読み込み中...</td></tr>
        {:else}
          {#each students as st}
            <tr>
              <td>{st.attend_no}</td>
              <td>{st.name}</td>
      
              {#each subjects.filter(s => s.exam_frequency && Number(s.exam_frequency) > 0) as subj}
                <td>{getFive(subj.id, st.id)}</td>
                <td>{getKanten(subj.id, st.id)}</td>
              {/each}
      
              <td>{attendance[st.id]?.zenki.attendance}</td>
              <td>{attendance[st.id]?.zenki.absence}</td>
              <td>{attendance[st.id]?.zenki.late}</td>
              <td>{attendance[st.id]?.zenki.early}</td>
              <td>{attendance[st.id]?.zenki.mourn}</td>
              <td>{attendance[st.id]?.zenki.stopped}</td>
              <td>{attendance[st.id]?.zenki.justified}</td>
              <td>{attendance[st.id]?.zenki.attendance_rate}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
      
    </table>
  </div>
  
  <style>
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      margin-top: 16px;
    }
  
    table {
  border-collapse: collapse;
  background: white;
  width: auto;
}

  
    th, td {
      border: 1px solid #ccc;
      padding: 4px 6px;
      text-align: center;
    }

    .snapshot-msg {
    margin-top: 8px;
    color: green;
    font-weight: bold;
    font-size: 14px;
    }

    .vertical-header {
  writing-mode: vertical-rl;
  transform: rotate(360deg);
  white-space: nowrap;
  padding: 4px;
  width: 30px;         /* coluna bem fina */
  max-width: 40px;
  text-align: center;
  vertical-align: middle;
}

  </style>
  