<script>
  import { apiFetch } from "$lib/api.js";
  import { attendanceStore } from "$lib/stores/attendanceStore.js";

  export let params;

  const course = params.course;
  const grade = params.grade;
  const className = params.className;
  const classId = `${course}-${grade}-${className}`;

  let today = new Date().toLocaleDateString("sv-SE");

  let students = [];
  let subjects = [];
  let summary = {};

  // carregar alunos
  attendanceStore.loadStudents(classId);

  $: students = ($attendanceStore.studentsInfo || [])
    .filter(s => s.status !== "休学")
    .map(s => ({ ...s, id: s.id.trim() }));

  // carregar subjects
  // carregar subjects
  async function loadSubjects() {
  const res = await apiFetch(`/api/subjects?course=${course}&grade=${grade}`);
  const data = res?.json ? await res.json() : res;

  subjects = Array.isArray(data) ? data : [];

  // 🔥 FILTRAR APENAS REQUIRED (campo correto é "type")
  subjects = subjects.filter(s => s.type === "required");
}



  // carregar attendance por aluno
  async function loadSummary() {
    const res = await apiFetch(
      `/api/attendance_sub/student_summary?date=${today}&course=${course}&grade=${grade}&class_name=${className}`
    );
    const data = res?.json ? await res.json() : res;
    summary = data.summary || {};
  }

  loadSubjects();
  loadSummary();

  function subjectName(subjectId) {
    const s = subjects.find(x => x.id === subjectId);
    return s ? s.name : subjectId;
  }
</script>

<h1>科目別 出席率（生徒別）</h1>
<h2>{course} {grade}年 {className}</h2>
<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    font-size: 14px;
  }

  thead {
    background: #f0f0f0;
  }

  th, td {
    padding: 10px 12px;
    text-align: center;
    border-bottom: 1px solid #e5e5e5;
  }

  tbody tr:nth-child(even) {
    background: #fafafa;
  }

  tbody tr:hover {
    background: #f5f5f5;
  }

  th {
    font-weight: bold;
  }

  td:first-child {
    text-align: left;
    font-weight: 600;
  }

  .rate-good {
    color: #2e8b57;
    font-weight: bold;
  }

  .rate-bad {
    color: #c0392b;
    font-weight: bold;
  }

  .rate-mid {
    color: #e67e22;
    font-weight: bold;
  }
</style>

<table>
  <thead>
    <tr>
      <th>生徒名</th>
      {#each subjects as s}
        <th>{s.name}</th>
      {/each}
    </tr>
  </thead>

  <tbody>
    {#each students as st}
      <tr>
        <td>{st.name}</td>

        {#each subjects as s}
        <td>
          {#if summary[st.id] && summary[st.id][s.id]}
            {#if summary[st.id][s.id].rate >= 80}
              <span class="rate-good">{summary[st.id][s.id].rate}%</span>
            {:else if summary[st.id][s.id].rate >= 50}
              <span class="rate-mid">{summary[st.id][s.id].rate}%</span>
            {:else}
              <span class="rate-bad">{summary[st.id][s.id].rate}%</span>
            {/if}
          {:else}
            -
          {/if}
        </td>
        
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
