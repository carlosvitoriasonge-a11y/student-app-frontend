<script>
  import { goto } from '$app/navigation';
  export let data;

  // Dados básicos
  $: course = data.course;
  $: grade = data.grade;
  $: className = data.className;
  $: students = data.students;
  $: studentStats = data.studentStats;

  // Ordenação
  $: sortedStudents = [...students].sort((a, b) => {
    const na = Number(String(a.attend_no).replace(/\D/g, ""));
    const nb = Number(String(b.attend_no).replace(/\D/g, ""));
    return na - nb;
  });

  // DAILY ATTENDANCE
  $: daily = data.dailyAttendance;
  $: today = new Date().toISOString().slice(0, 10);

  // Status do dia
  $: classStatusToday = daily?.[today] ?? null;

  // Cálculo de presentes e ausentes
  function computeCurrentStatus(statuses) {
    if (!statuses) return { present: 0, absent: 0 };

    let present = 0;
    let absent = 0;

    for (const [status, count] of Object.entries(statuses)) {
      if (status === "出席" || status === "遅刻") {
        present += count;
      } else {
        absent += count;
      }
    }

    return { present, absent };
  }

  $: ({ present, absent } = computeCurrentStatus(classStatusToday));

  console.log("DAILY >>>", daily);
  console.log("HOJE >>>", today);
  console.log("STATUS HOJE >>>", classStatusToday);
  console.log("PRESENTES:", present, "AUSENTES:", absent);
</script>


  
  <h1>（{course}） {grade}年 {className}
    
    {#if classStatusToday}
    <span style="font-size: 0.8em; margin-left: 10px;">
      　　　　現在の生徒状況：
      いる生徒：{present} 人　
      いない生徒：{absent} 人
    </span>

    {:else}
    <span style="font-size: 0.8em; margin-left: 10px; color: black;">
      　　　　（本日の出席はまだ記録されていません。）
    </span>

  {/if}
</h1>

  <button class="seat-button" on:click={() => goto(`/class/${course}/${grade}/${className}/seating`)}
  >座席表を見る
  </button>

  <button
  class="attendance-button"
  on:click={() => goto(`/class/${course}/${grade}/${className}/attendance`)}
  >HRの出欠を記録する
  </button>

  
  
  {#if students.length === 0}
    <p>このクラスには生徒がいません。</p>
  {:else}
    <div class="table-wrapper">
    <table class="students-table">
      <thead>
        <tr>
          <th rowspan="2" class="num-col vertical-header">出席番号</th>
          <th rowspan="2" class="name-col">名前</th>
          <th colspan="10" class="term-header">前期</th>
          <th colspan="10" class="term-header">後期</th>
          <th colspan="10" class="term-header">合計</th>
        </tr>

        <tr>
          <th class="compact-col">授業日数</th>
          <th class="compact-col">出席すべき日数</th>
          <th class="compact-col">出　　席</th>
          <th class="compact-col">欠　　席</th>
          <th class="compact-col">遅　　刻</th>
          <th class="compact-col">早　　退</th>
          <th class="compact-col">忌 引 き</th>
          <th class="compact-col">出　　停</th>
          <th class="compact-col">公　　欠</th>
          <th class="compact-col">出 席 率（％）</th>

          <th class="compact-col">授業日数</th>
          <th class="compact-col">出席すべき日数</th>
          <th class="compact-col">出　　席</th>
          <th class="compact-col">欠　　席</th>
          <th class="compact-col">遅　　刻</th>
          <th class="compact-col">早　　退</th>
          <th class="compact-col">忌 引 き</th>
          <th class="compact-col">出　　停</th>
          <th class="compact-col">公　　欠</th>
          <th class="compact-col">出 席 率（％）</th>

          <th class="compact-col">授業日数</th>
          <th class="compact-col">出席すべき日数</th>
          <th class="compact-col">出　　席</th>
          <th class="compact-col">欠　　席</th>
          <th class="compact-col">遅　　刻</th>
          <th class="compact-col">早　　退</th>
          <th class="compact-col">忌 引 き</th>
          <th class="compact-col">出　　停</th>
          <th class="compact-col">公　　欠</th>
          <th class="compact-col">出 席 率（％）</th>
        </tr>
      </thead>
    
  
      <tbody>
        {#each sortedStudents as student}
          <tr>
            <td>{student.attend_no}</td>
            <td>
              <a on:click={() => goto(`/students/${student.id}`)}>
                {student.name}
              </a>
            </td>
            
      
            <!-- 前期 -->
            <td>{studentStats?.[student.id]?.first_term?.school_days ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.required_attendance_days?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.attendance ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.absence ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.late ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.early ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.mourn ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.stopped ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.justified ?? 0}</td>
            <td>{studentStats?.[student.id]?.first_term?.attendance_rate ?? 0}</td>
      
            <!-- 後期 -->
            <td>{studentStats?.[student.id]?.second_term?.school_days ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.required_attendance_days ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.attendance ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.absence ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.late ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.early ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.mourn ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.stopped ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.justified ?? 0}</td>
            <td>{studentStats?.[student.id]?.second_term?.attendance_rate ?? 0}</td>
      
            <!-- 合計 -->
            <td>{studentStats?.[student.id]?.total?.school_days ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.required_attendance_days ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.attendance ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.absence ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.late ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.early ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.mourn ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.stopped ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.justified ?? 0}</td>
            <td>{studentStats?.[student.id]?.total?.attendance_rate ?? 0}</td>
          </tr>
        {/each}
      </tbody>
      
      
      
    </table>
  </div>
   
  {/if}
  
<style>
  /* ============================
     COLUNAS ESPECIAIS
  ============================ */

  /* Colunas verticais (遅刻, 早退, 忌引 etc.) */
  .compact-col {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  width: 14px;
  min-width: 14px;
  max-width: 20px;
  padding: 4px 0;
  text-align: center;
  background: #fafafa;
  border-right: 1px solid #ddd;
  font-size: 14px;
  justify-content: center;
  align-items: center;
  }

  /* 出席番号 vertical */
  .vertical-header {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  justify-content: center;
  align-items: center;
  
  }

  /* 出席番号 */
  .num-col {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  text-align: center;
  }

  /* 名前 */
  .name-col {
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  }

  /* Segunda linha do thead (normal, horizontal) */
  .header-col {
  text-align: center;
  white-space: nowrap;
  }

/* 前期 / 後期 / 合計 */
  .term-header { 
  background: #e8f0fe; 
  text-align: center; 
  font-weight: 700; 
  border-left: 1px solid #ccc; 
  border-right: 1px solid #ccc; 
  }


  /* ============================
   TABELA
  ============================ */

  .students-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: 1200px;
  }

/* THEAD */
  .students-table th {
  padding: 8px 10px;
  background: #f2f2f2;
  border-bottom: 2px solid #444;
  white-space: nowrap;
  text-align: center;
  }

/* TBODY */
  .students-table td {
  padding: 8px 10px;
  text-align: center;
  border-bottom: 1px solid #444;
  font-size: clamp(10px, 1vw, 14px);
  }

  /* Hover */
  .students-table tr:hover {
  background: #fafafa;
  }

  /* Fundo sólido do thead */
  .students-table thead {
  background: #f2f2f2;
  }

/* Sticky header (2 linhas) */
  .students-table thead tr:nth-child(1) th {
  position: static;
  top: auto;
  z-index: auto;
  }

  .students-table thead tr:nth-child(2) th {
  position: static;
  top: auto;
  z-index: auto;
  }

  .table-wrapper {
  max-width: none;
  overflow: visible;
}





/* ============================
   GRID / BORDAS
============================ */

/* Bordas verticais */
  .students-table th, 
  .students-table td { 
  border-right: 1px solid #999;
  }

  .students-table th:first-child, 
  .students-table td:first-child { 
  border-left: 1px solid #999; 
  }

/* Linha superior da tabela */
  .students-table thead th {
  border-top: 1px solid #000;
  }

/* Linha grossa entre 前期 → 後期 */
  .students-table th:nth-child(11),
  .students-table td:nth-child(13) {
  border-left: 3px solid #000;
  }

/* Linha grossa entre 後期 → 合計 */
  .students-table th:nth-child(21),
  .students-table td:nth-child(23) {
  border-left: 3px solid #000;
  }

/* Colunas de porcentagem (evita cortar 100) */

  .students-table th:nth-child(3),
  .students-table td:nth-child(3),
  .students-table th:nth-child(12),
  .students-table td:nth-child(12),
  .students-table th:nth-child(22),
  .students-table td:nth-child(22),
  .students-table th:nth-child(32),
  .students-table td:nth-child(32) {
  min-width: 5px;
  max-width: 30px;
  }

  .students-table td:nth-child(3),
  .students-table td:nth-child(4),
  .students-table td:nth-child(5),
  .students-table td:nth-child(6),
  .students-table td:nth-child(7),
  .students-table td:nth-child(12),
  .students-table td:nth-child(13),
  .students-table td:nth-child(14),
  .students-table td:nth-child(15),
  .students-table td:nth-child(16),
  .students-table td:nth-child(22),
  .students-table td:nth-child(23),
  .students-table td:nth-child(24),
  .students-table td:nth-child(25),
  .students-table td:nth-child(26),
  .students-table td:nth-child(32)
 {
  min-width: 15px !important;
  max-width: 30px !important;
}



/* ============================
   LINKS
============================ */

  .students-table td a {
  color: #0070f3;
  text-decoration: none;
  cursor: pointer;
  }

  .students-table td a:hover {
  text-decoration: underline;
  }


/* ============================
   BOTÕES
============================ */

  .seat-button, .attendance-button { 
  display: inline-block; 
  padding: 8px 14px; 
  border-radius: 6px; 
  text-decoration: none; 
  font-weight: 600; 
  color: white; 
  margin: 1rem 0; 
  } 

  .seat-button { background: #0070f3; }
  .seat-button:hover { background: #0059c9; }

  .attendance-button { background: #28a745; margin-left: 1rem; }
  .attendance-button:hover { background: #1e7e34; }
  /* Centralização correta para texto vertical */
  .compact-col,
  .vertical-header {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  text-align: center;
  line-height: 1.2;
  padding: 0;
  }

  /* Fixar 出席番号 (coluna 1) */
.students-table th:nth-child(1),
.students-table td:nth-child(1) {
  position: static;
  left: auto;
  z-index: auto;
  background: #f2f2f2;
}

/* Fixar 名前 (coluna 2) */
.students-table th:nth-child(2),
.students-table td:nth-child(2) {
  position: static;
  left: auto; /* largura da coluna 出席番号 */
  z-index: auto;
  background: #f2f2f2;
}




  

</style>
  