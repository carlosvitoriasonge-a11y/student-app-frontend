<script>
  import { goto } from '$app/navigation';
  export let data;

  $: course = data.course;
  $: grade = data.grade;
  $: className = data.className;
  $: students = data.students;
  $: studentStats = data.studentStats;


  // 出席番号で並び替え
  $: sortedStudents = [...students].sort((a, b) => {
    const na = Number(String(a.attend_no).replace(/\D/g, ""));
    const nb = Number(String(b.attend_no).replace(/\D/g, ""));
    return na - nb;
  });
  

</script>

  
  <h1>（{course}） {grade}年 {className}</h1>

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
          <!-- 前期 -->
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

          <!-- 後期 -->
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

          <!-- 合計 -->
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
            <td>{student.name}</td>
      
            <!-- 前期 -->
            <td>{studentStats?.[student.id]?.first_term?.school_days}</td>
            <td>{studentStats?.[student.id]?.first_term?.required_attendance_days}</td>
            <td>{studentStats?.[student.id]?.first_term?.attendance}</td>
            <td>{studentStats?.[student.id]?.first_term?.absence}</td>
            <td>{studentStats?.[student.id]?.first_term?.late}</td>
            <td>{studentStats?.[student.id]?.first_term?.early}</td>
            <td>{studentStats?.[student.id]?.first_term?.mourn}</td>
            <td>{studentStats?.[student.id]?.first_term?.stopped}</td>
            <td>{studentStats?.[student.id]?.first_term?.justified}</td>
            <td>{studentStats?.[student.id]?.first_term?.attendance_rate}</td>
      
            <!-- 後期 -->
            <td>{studentStats?.[student.id]?.second_term?.school_days}</td>
            <td>{studentStats?.[student.id]?.second_term?.required_attendance_days}</td>
            <td>{studentStats?.[student.id]?.second_term?.attendance}</td>
            <td>{studentStats?.[student.id]?.second_term?.absence}</td>
            <td>{studentStats?.[student.id]?.second_term?.late}</td>
            <td>{studentStats?.[student.id]?.second_term?.early}</td>
            <td>{studentStats?.[student.id]?.second_term?.mourn}</td>
            <td>{studentStats?.[student.id]?.second_term?.stopped}</td>
            <td>{studentStats?.[student.id]?.second_term?.justified}</td>
            <td>{studentStats?.[student.id]?.second_term?.attendance_rate}</td>
      
            <!-- 合計 -->
            <td>{studentStats?.[student.id]?.total?.school_days}</td>
            <td>{studentStats?.[student.id]?.total?.required_attendance_days}</td>
            <td>{studentStats?.[student.id]?.total?.attendance}</td>
            <td>{studentStats?.[student.id]?.total?.absence}</td>
            <td>{studentStats?.[student.id]?.total?.late}</td>
            <td>{studentStats?.[student.id]?.total?.early}</td>
            <td>{studentStats?.[student.id]?.total?.mourn}</td>
            <td>{studentStats?.[student.id]?.total?.stopped}</td>
            <td>{studentStats?.[student.id]?.total?.justified}</td>
            <td>{studentStats?.[student.id]?.total?.attendance_rate}</td>
          </tr>
        {/each}
      </tbody>
      
      
      
    </table>
    </div>
  {/if}
  
  <style>
    .compact-col {
      width: 1px;
      min-width: 1px;
      max-width: 20px;
      writing-mode: vertical-rl;
      text-orientation: upright;
      white-space: nowrap;
      padding: 2px 0;
      text-align: center;
    }

    .name-col {
      width: auto;
      white-space: nowrap;
    }

    .num-col {
      width: 1px; /* deixa o navegador encolher ao máximo */
      padding: 0;
      text-align: center;
      border-right: 1px solid #ddd;
    }


    .term-header { 
      background: #e8f0fe; 
      text-align: center; 
      font-weight: 700; 
      border-left: 1px solid #ccc; 
      border-right: 1px solid #ccc; 
    }

    .students-table th {
      border-bottom: 1px solid #ddd;
      padding: 6px 4px;
    }
    .students-table td {
      padding: 6px 4px;
    }

    .students-table th {
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #ddd;
}


    .students-table td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
  
    .students-table th {
      background: #f2f2f2;
      font-weight: 600;
    }
  
    .students-table tr:hover {
      background: #fafafa;
    }
  
    a {
      color: #0070f3;
      text-decoration: none;
    }
  
    a:hover {
      text-decoration: underline;
    }

    .seat-button {
  display: inline-block;
  margin: 1rem 0;
  padding: 8px 14px;
  background: #0070f3;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}

.seat-button:hover {
  background: #0059c9;
}

.attendance-button { 
  display: inline-block; 
  margin: 1rem 0 1rem 1rem; 
  padding: 8px 14px; 
  background: #28a745; /* verde */ 
  color: white; 
  border-radius: 6px; 
  text-decoration: none; 
  font-weight: 600; 
} 
  
  
.attendance-button:hover { 
  background: #1e7e34; 
}

.vertical-header {
  writing-mode: vertical-rl;   /* texto em pé */
  text-orientation: upright;   /* deixa a leitura natural */
  white-space: nowrap;
  width: 14px;                 /* coluna bem estreita */
  padding: 4px 0;
  text-align: center;
  background: #f2f2f2;
  font-weight: 600;
}

.compact-col {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  padding: 3px 0;
  width: 2px;
  min-width: 3px;
  max-width: 20px;
  text-align: center;
  background: #fafafa;
  border-right: 1px solid #ddd;
  font-size: 18px;
}

.students-table { 
  table-layout: auto; /* deixa o navegador calcular baseado no conteúdo real */ 
}

.students-table {
  border-collapse: separate; /* importante */
  border-spacing: 0;
}

.students-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-wrapper {
  max-height: 500px; /* ajuste como quiser */
  overflow-y: auto;
}

  </style>
  