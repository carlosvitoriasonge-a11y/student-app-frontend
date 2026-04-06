<script lang="ts">
    import { onMount } from "svelte";
    import { apiFetch } from "$lib/api";
  
    export let params;
  
    const course = params.course;
    const grade = params.grade;
  
    let students = [];
    let allStudents = [];

  
    // layout fixo 学年集会
    let baseRows = 12;
    let baseCols = 7;
  
    let maxRows = baseRows;
    let maxCols = baseCols;
  
    let isEditing = false;
    let viewMode: "teacher" | "student" = "teacher";
    let saving = false;
    let saveMessage = "";
  
    type Seat = {
      row: number;
      col: number;
      active: boolean;
      student_id: string | null;
    };
  
    function defaultGrid(): Seat[] {
      const arr: Seat[] = [];
      for (let r = 1; r <= baseRows; r++) {
        for (let c = 1; c <= baseCols; c++) {
          arr.push({
            row: r,
            col: c,
            active: true,
            student_id: null
          });
        }
      }
      return arr;
    }
  
    let gakunenSeats: Seat[] = defaultGrid();
  
    $: seats = gakunenSeats;
  
    // carregar 学年 inteiro + seating
    onMount(async () => {
      try {
        // alunos do 学年 inteiro
        const dataStudents = await apiFetch(
          `/api/students/filter?course=${course}&grade=${grade}&class_name=ALL`
        );
  
        allStudents = dataStudents.filter(s => s.status !== "休学");
        students = [...allStudents];
  
        // seating 学年集会
        const dataSeating = await apiFetch(
          `/api/students/seating?course=${course}&grade=${grade}&type=gakunen`
        );
  
        gakunenSeats = dataSeating?.seats?.length
          ? dataSeating.seats
          : defaultGrid();

          recomputeUnseated();

  
      } catch (err) {
        console.error("Erro ao carregar 学年集会:", err);
      }
    });
  
    // DRAG & DROP
    let draggedStudentId = null;
    let isDragging = false;
    let hoverSeatKey = null;
  
    function seatKey(r, c) {
      return `${r}-${c}`;
    }

    function recomputeUnseated() {
  const seatedIds = new Set(
    gakunenSeats
      .filter(s => s.student_id)
      .map(s => s.student_id as string)
  );

  students = sortByAttendNo(
  allStudents.filter(s => !seatedIds.has(s.id))
);
}


  
    function handleStudentDragStart(e, id) {
      if (!isEditing) return;
      draggedStudentId = id;
      isDragging = true;
      e.dataTransfer?.setData("text/plain", id);
    }
  
    function handleStudentDragEnd() {
      draggedStudentId = null;
      isDragging = false;
      hoverSeatKey = null;
    }
  
    function handleSeatDragOver(e, seat) {
      if (!isEditing) return;
      if (!seat.active) return;
      e.preventDefault();
      hoverSeatKey = seatKey(seat.row, seat.col);
    }
  
    function handleSeatDragLeave(e, seat) {
      if (hoverSeatKey === seatKey(seat.row, seat.col)) {
        hoverSeatKey = null;
      }
    }
  
    function handleSeatDrop(e, seat) {
  if (!isEditing) return;
  if (!seat.active) return;

  e.preventDefault();

  const id = draggedStudentId || e.dataTransfer?.getData("text/plain");
  if (!id) return;

  // limpa qualquer seat anterior desse aluno
  gakunenSeats.forEach(s => {
    if (s.student_id === id) s.student_id = null;
  });

  // coloca no novo seat
  seat.student_id = id;

  // força reatividade
  gakunenSeats = [...gakunenSeats];

  // recalcula lista de não sentados
  recomputeUnseated();

  draggedStudentId = null;
  isDragging = false;
  hoverSeatKey = null;
}




  
function handleStudentListDrop(e) {
  if (!isEditing) return;

  e.preventDefault();
  const id = draggedStudentId || e.dataTransfer?.getData("text/plain");
  if (!id) return;

  // tira esse aluno de todos os seats
  gakunenSeats.forEach(s => {
    if (s.student_id === id) s.student_id = null;
  });

  // força reatividade
  gakunenSeats = [...gakunenSeats];

  // recalcula lista de não sentados
  recomputeUnseated();

  draggedStudentId = null;
  isDragging = false;
  hoverSeatKey = null;
}

    function colLetter(c) {
      return String.fromCharCode(64 + c);
    }
  
    let lastTap = 0;
    function handleSeatTap(r, c) {
      if (!isEditing) return;
      const now = Date.now();
      if (now - lastTap < 300) toggleSeat(r, c);
      lastTap = now;
    }
  
    function toggleSeat(r, c) {
      const seat = seats.find(s => s.row === r && s.col === c);
      if (!seat) return;
      seat.active = !seat.active;
      if (!seat.active) seat.student_id = null;
      gakunenSeats = [...gakunenSeats];
    }
  
    function clearAllSeats() {
  gakunenSeats.forEach(s => s.student_id = null);
  gakunenSeats = [...gakunenSeats];
  recomputeUnseated();
}

  
function applyAuto() {
  if (!allStudents.length) return;

  const sorted = [...allStudents].sort((a, b) =>
    (a.attend_no ?? 0) - (b.attend_no ?? 0)
  );

  const copy = gakunenSeats.map(s => ({ ...s }));
  let i = 0;

  for (let c = 1; c <= maxCols; c++) {
    for (let r = 1; r <= maxRows; r++) {
      const seat = copy.find(s => s.row === r && s.col === c);
      if (!seat || !seat.active) continue;
      if (i >= sorted.length) break;
      seat.student_id = sorted[i].id;
      i++;
    }
  }

  gakunenSeats = [...copy];
  recomputeUnseated();
}





  
    async function save() {
      try {
        saving = true;
        saveMessage = "";
  
        await apiFetch("/api/students/seating/save", {
          method: "POST",
          body: JSON.stringify({
            course,
            grade,
            class_name: null,
            type: "gakunen",
            seats
          })
        });
  
        saveMessage = "✔ 保存しました";
        isEditing = false;
  
        setTimeout(() => saveMessage = "", 2000);
  
      } catch (err) {
        console.error("Erro ao salvar:", err);
        saveMessage = "✘ 保存に失敗しました";
      } finally {
        saving = false;
      }
    }

    function studentName(id: string | null) {
  if (!id) return '';
  const s = allStudents.find(st => st.id === id);
  return s ? s.name : '';
}

function sortByAttendNo(list) {
  return list.sort((a, b) => (a.attend_no ?? 0) - (b.attend_no ?? 0));
}


  </script>
  
  <svelte:head>
    <title>学年集会 座席表</title>
  </svelte:head>
  
  <div class="seating-page">
    <header class="seating-header">
      <div class="left">
        <h1>学年集会 座席表</h1>
  
        <div class="mode-switch">
          <button
            class:selected={true}
            on:click={() => isEditing && applyAuto()}
          >
            出席番号順
          </button>
        </div>
      </div>
  
      <div class="right">
        <button
          class:selected={viewMode === "teacher"}
          on:click={() => viewMode = "teacher"}
        >
          教員ビュー
        </button>
  
        <button
          class:selected={viewMode === "student"}
          on:click={() => viewMode = "student"}
        >
          生徒ビュー
        </button>
  
        <button
          class="random-btn"
          on:click={applyAuto}
          disabled={!isEditing}
        >
          ランダム
        </button>
  
        {#if !isEditing}
          <button class="primary" on:click={() => { viewMode = "student"; isEditing = true; }}>
            編集
          </button>
        {:else}
          <button on:click={() => isEditing = false}>キャンセル</button>
          <button on:click={clearAllSeats}>全てクリア</button>
          <button class="primary" on:click={save}>保存</button>
  
          {#if saveMessage}
            <div class="save-feedback">{saveMessage}</div>
          {/if}
        {/if}
      </div>
    </header>
  
    <main class="seating-main">
      <section class="seating-grid-wrapper">
        {#if viewMode === "student"}
          <div class="teacher-desk">教卓</div>
        {/if}
  
        <div class="seating-grid">
          {#each Array(maxRows) as _, r}
            <div class="row" style={`--cols: ${maxCols}`}>
              {#each Array(maxCols) as _, c}
                {@const rReal = viewMode === "teacher" ? maxRows - 1 - r : r}
                {@const cReal = viewMode === "teacher" ? maxCols - 1 - c : c}
  
                {#key `${rReal}-${cReal}`}
                  <div
                    class={`seat 
                      ${seats[rReal * maxCols + cReal].active ? "active" : "inactive"} 
                      ${isDragging && seats[rReal * maxCols + cReal].active ? "drop-ready" : ""} 
                      ${hoverSeatKey === seatKey(rReal + 1, cReal + 1) ? "drop-hover" : ""}
                    `}
                    on:click={() => handleSeatTap(rReal + 1, cReal + 1)}
                    on:dragover={(e) => handleSeatDragOver(e, seats[rReal * maxCols + cReal])}
                    on:dragleave={(e) => handleSeatDragLeave(e, seats[rReal * maxCols + cReal])}
                    on:drop={(e) => handleSeatDrop(e, seats[rReal * maxCols + cReal])}
                  >
                    {#if seats[rReal * maxCols + cReal].active}
                      {#if seats[rReal * maxCols + cReal].student_id}
                        <span
                          class="student-name"
                          draggable={isEditing && viewMode === "student"}
                          on:dragstart={(e) =>
                            handleStudentDragStart(
                              e,
                              seats[rReal * maxCols + cReal].student_id
                            )}
                          on:dragend={handleStudentDragEnd}
                        >
                          {allStudents.find(s => s.id === seats[rReal * maxCols + cReal].student_id)?.name}

                        </span>
                      {:else}
                        <span class="seat-number">
                          {rReal + 1}-{colLetter(cReal + 1)}
                        </span>
                      {/if}
                    {:else}
                      <span class="inactive-mark">×</span>
                    {/if}
                  </div>
                {/key}
              {/each}
            </div>
          {/each}
        </div>
  
        {#if viewMode === "teacher"}
          <div class="teacher-desk">教卓</div>
        {/if}
      </section>
  
      <aside
        class="student-list-wrapper"
        on:dragover={(e) => e.preventDefault()}
        on:drop={handleStudentListDrop}
      >
        <h2>生徒一覧（学年全体）</h2>
  
        <ul class="student-list">
          {#each students as student}
            <li
              class="student-item"
              draggable={isEditing && viewMode === "student"}
              on:dragstart={(e) => handleStudentDragStart(e, student.id)}
              on:dragend={handleStudentDragEnd}
            >
              {student.attend_no}番 {student.name}
            </li>
          {/each}
        </ul>
  
        {#if isEditing}
          <p class="hint">
            生徒をドラッグして座席に配置できます。<br />
            ☆座席をダブルクリックすると有効/無効を切り替えます。
          </p>
        {/if}
      </aside>
    </main>
  </div>
  
<style>

    .student-item,
    .seat {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      -webkit-touch-callout: none;
    }
  
    .seating-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
  
  
    .seating-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
  
    .seating-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
  
    .mode-switch button,
    .seating-header .right > button {
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      background: #f5f5f5;
      cursor: pointer;
    }
  
    .seating-header .right > button.primary {
        background: #16a34a;
        color: white;
        border-color: #16a34a;
    }
  
  
    button.selected {
      background: #2563eb !important;
      color: white !important;
      border-color: #2563eb !important;
    }
  
    .seating-header .primary {
      background: #16a34a;
      color: white;
      border-color: #16a34a;
    }
  
    .seating-main {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
    }
  
    .seating-grid-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }
  
    .teacher-desk {
      padding: 0.4rem 0.8rem;
      background: #e5e7eb;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  
    .seating-grid {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: #f9fafb;
      padding: 0.6rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
  
    .row {
    display: grid;
    grid-template-columns: repeat(var(--cols, 6), 1fr);
    gap: 0.4rem;
    }
  
  
    .seat {
      min-width: 75px; /* antes 60px */ 
      min-height: 75px; /* antes 60px */ 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 6px; 
      border: 3px solid #d1d5db; 
      font-size: 0.9rem; /* leve aumento */ 
      touch-action: none; /* essencial no iPad */ 
      transition: background 0.1s, border-color 0.1s, box-shadow 0.1s; }
  
    .seat.active {
      background: white;
      cursor: pointer;
    }
  
    .seat.inactive {
      background: #d1d5db;
      border-color: #9ca3af !important;
      color: #6b7280;
      cursor: pointer;
    }
  
    .seat.active:hover {
      background: #e0f2fe;
      border-color: #0284c7;
    }
  
    .seat.drop-ready {
      box-shadow: 0 0 0 2px #bfdbfe;
    }
  
    .seat.drop-hover {
      background: #dbeafe;
      border-color: #1d4ed8;
    }
  
    .student-name { 
      font-size: 1.4rem; /* maior e mais legível */ 
      font-weight: 600; /* mais forte */ 
      text-align: center; /* centralizado */ 
      line-height: 1.2; /* mais compacto */ 
      word-break: keep-all; /* japonês quebra naturalmente */ 
      white-space: normal; /* permite 2 linhas */ 
      display: flex; 
      flex-direction: column; /* força quebra vertical */ 
      justify-content: center; 
      align-items: center; 
    }
  
    .seat-number {
      font-size: 0.7rem;
      color: #6b7280;
    }
  
    .inactive-mark {
      font-size: 1rem;
      color: #4b5563;
    }
  
    .student-list-wrapper {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.6rem;
      background: #f9fafb;
    }
  
    .student-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
  
    .student-item {
      padding: 0.8rem 1rem; /* antes: 0.3rem 0.5rem */ 
      background: white; 
      border-radius: 5px; 
      border: 2px solid #e5e7eb; 
      font-size: 0.85rem; 
      cursor: grab; 
      touch-action: none; /* melhora drag no iPad */ }
  
    .student-item:active {
      cursor: grabbing;
    }
  
    .hint {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
  
    /* ⬇️ FEEDBACK DO SALVAR */ 
    .save-feedback { 
      margin-top: 6px; 
      font-weight: bold; 
      color: #0a0; } 
    /* ⬆️ FEEDBACK DO SALVAR */
  
    .button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    }
  
    .fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white;
    z-index: 9999;
    overflow: auto;
    padding: 20px;
  }
  
  .fullscreen-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #007aff;
    color: white;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 9999;
  }
  
  .fullscreen-overlay {
    position: fixed;
    inset: 0;
    background: white;
    z-index: 9998;
    overflow: auto;
    padding: 20px;
  }
  
  .fullscreen-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  
    @media (max-width: 768px) {
      .seating-main {
        grid-template-columns: 1fr;
      }
    }
  </style>
  