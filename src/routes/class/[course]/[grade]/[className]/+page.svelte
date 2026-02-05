<script>
  import { goto } from '$app/navigation';
  export let data;

  $: course = data.course;
  $: grade = data.grade;
  $: className = data.className;
  $: students = data.students;
  

</script>

  
  <h1>{course} {grade}年 {className}</h1>

  <button class="seat-button" on:click={() => goto(`/class/${course}/${grade}/${className}/seating`)}
  >座席表を見る
  </button>
  
  
  {#if students.length === 0}
    <p>このクラスには生徒がいません。</p>
  {:else}
    <table class="students-table">
      <thead>
        <tr>
          <th class="num-col">出席番号</th>
          <th>名前</th>
        </tr>
      </thead>
  
      <tbody>
        {#each students as student}
          <tr>
            <td class="num-col">{student.attend_no}</td>
            <td>
              <a href={`/students/${student.id}`}>
                {student.name}
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  
  <style>
    .students-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      margin-top: 1rem;
    }
    .num-col {
      width: 80px;
      text-align: center;
      border-right: 1px solid #ddd;
    }

    .students-table th,
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

  </style>
  