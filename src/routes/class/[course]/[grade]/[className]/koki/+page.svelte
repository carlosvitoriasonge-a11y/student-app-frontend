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

  // 🔥 HYOKA MANUAL
  let hyoka = {};

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

    // 1) STUDENTS
    students = await apiFetch(
      `/api/students/by_class?course=${course}&grade=${grade}&class_name=${className}`
    );

    students = students
      .filter(s => s.status !== "休学")
      .map(s => ({ ...s, attend_no: Number(s.attend_no) }))
      .sort((a, b) => a.attend_no - b.attend_no);

    // 2) SUBJECTS
    const resSubjects = await apiFetch(
      `/api/subjects?course=${course}&grade=${grade}`
    );
    subjects = sortSubjects(resSubjects);

    // 3) EVALUATIONS (continuous)
    evaluations = await apiFetch(
      `/api/evaluation/class/all?course=${course}&grade=${grade}&class_name=${className}`
    );

    // 4) HYOKA MANUAL
    const hyokaRes = await apiFetch(
      `/api/evaluation/hyoka?grade=${grade}&class_name=${className}`
    );
    hyoka = hyokaRes?.json ? await hyokaRes.json() : hyokaRes;

    // 5) ATTENDANCE
    const thisYear = new Date().getFullYear();
    const sy = thisYear - 1;

    attendance = await apiFetch(
      `/api/attendance_hr_boletin/hr?course=${course}&grade=${grade}&class_name=${className}&sy=${sy}`
    );

    await tick();
  });

  // ============================================================
  // FUNÇÕES DO KOKI (nota final + 観点)
  // ============================================================

  // 🔥 PRIORIDADE: manual > automático > 未
  function getFinalFive(subjectId, studentId) {
    const ev = evaluations?.[subjectId]?.[studentId];
    if (!ev) return "未";

    const auto = ev.continuous?.five_scale ?? null;
    const saved = hyoka?.[studentId]?.[subjectId]?.evaluation ?? null;

    if (saved != null) return saved;
    if (auto != null) return auto;

    return "未";
  }

  function getKantenKoki(subjectId, studentId) {
    const ev = evaluations?.[subjectId]?.[studentId];
    return ev?.continuous?.kanten ?? "-";
  }

</script>

<h1>通知表（後期） — {classLabel}</h1>

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
              <td>{getFinalFive(subj.id, st.id)}</td>
              <td>{getKantenKoki(subj.id, st.id)}</td>
            {/each}

            <td>{attendance[st.id]?.total.attendance}</td>
            <td>{attendance[st.id]?.total.absence}</td>
            <td>{attendance[st.id]?.total.late}</td>
            <td>{attendance[st.id]?.total.early}</td>
            <td>{attendance[st.id]?.total.mourn}</td>
            <td>{attendance[st.id]?.total.stopped}</td>
            <td>{attendance[st.id]?.total.justified}</td>
            <td>{attendance[st.id]?.total.attendance_rate}</td>
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

  .vertical-header {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    white-space: nowrap;
    width: 40px;
    max-width: 40px;
    padding: 4px 2px;
  }
</style>
