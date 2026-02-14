<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  export let params;

  const course = params.course;
  const grade = params.grade;
  const className = params.className;

  let students = [];

  onMount(async () => {
    try {
      const data = await apiFetch(
        `/api/students/filter?grade=${grade}&class_name=${className}&course=${course}`
      );

      // filtra 休学
      students = data.filter(s => s.status !== "休学");

    } catch (err) {
      console.error("エラー:", err);
    }
  });

  // -----------------------------
// AJUSTE DINÂMICO DO AUTO/CUSTOM (máximo 35)
// -----------------------------
$: if (students.length > 0) {
  const total = Math.min(students.length, 35); // limite máximo 35

  const rows = baseRows; // 5 linhas fixas

  // calcula colunas necessárias, mas nunca menos que 6
  baseCols = Math.max(6, Math.ceil(total / rows));

  // recria grids auto/custom com o novo tamanho
  autoSeats = defaultGrid();
  customSeats = defaultGrid();
}


  
  // mock de alunos (depois vem do backend)
  let baseRows = 5;
  let baseCols = 6;

  // valores reativos usados pelo grid
  let maxRows = baseRows;
  let maxCols = baseCols;


  let isEditing = false;
  let seatingType: 'auto' | 'custom' | 'A' | 'B' | 'C' = 'auto';
  let viewMode: 'teacher' | 'student' = 'teacher';
  let saving = false
  let saveMessage = "";

  // maxRows/maxCols passam a depender do tipo de layout
    $: maxCols =
    seatingType === 'C'
      ? 8
      : baseCols; // baseCols = 6

    $: maxRows =
      seatingType === 'A' || seatingType === 'B'
      ? 12
      : seatingType === 'C'
        ? 5
        : baseRows; // baseRows = 5




  // -----------------------------
  // SEATS (estrutura inicial)
  // -----------------------------
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

  function defaultGridAB(): Seat[] {
    const arr: Seat[] = [];
    for (let r = 1; r <= 12; r++) {
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

  function defaultGridC(): Seat[] {
    const arr: Seat[] = [];
    for (let r = 1; r <= 5; r++) {      // 8 fileiras fixas
      for (let c = 1; c <= 8; c++) {    // 5 colunas fixas
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


  let autoSeats: Seat[] = defaultGrid();
  let customSeats: Seat[] = defaultGrid();
  let ASeats: Seat[] = defaultGridAB();
  let BSeats: Seat[] = defaultGridAB();
  let CSeats: Seat[] = defaultGridC();


  $: seats =
    seatingType === "auto" ? autoSeats :
    seatingType === "custom" ? customSeats :
    seatingType === "A" ? ASeats :
    seatingType === "B" ? BSeats : 
    CSeats;



  function getSeat(row: number, col: number) {
    return seats.find((s) => s.row === row && s.col === col);
  }

  function seatAt(row: number, col: number) {
    return getSeat(row, col);
  }

  function toggleSeat(row: number, col: number) {
    if (!isEditing) return;

    const seat = getSeat(row, col);
    if (!seat) return;

    seat.active = !seat.active;

    if (!seat.active) {
      seat.student_id = null;
    }

    seats = seats;
  }

  function studentName(id: string | null) {
    if (!id) return '';
    const s = students.find((st) => st.id === id);
    return s ? s.name : '';
  }


  onMount(async () => {
    try {
      // espera students carregar primeiro
      const wait = () => new Promise(r => setTimeout(r, 50));
      while (students.length === 0) {
        await wait();
      }

      const data = await apiFetch(
       `/api/students/seating?course=${course}&grade=${grade}&class_name=${className}`
      );

      autoSeats = data.auto?.length ? data.auto : defaultGrid(); 
      customSeats = data.custom?.length ? data.custom : defaultGrid(); 
      ASeats = data.A?.length ? data.A : defaultGridAB(); 
      BSeats = data.B?.length ? data.B : defaultGridAB();
      CSeats = data.C?.length ? data.C : defaultGridC();

      

    } catch (err) {
      console.error("Erro ao carregar seating:", err);
    }
  });



  // -----------------------------
  // DRAG & DROP
  // -----------------------------
  let draggedStudentId: string | null = null;
  let isDragging = false;
  let hoverSeatKey: string | null = null;

  function seatKey(row: number, col: number) {
    return `${row}-${col}`;
  }

  function handleStudentDragStart(event: DragEvent, studentId: string) {
    if (!isEditing) return;
    draggedStudentId = studentId;
    isDragging = true;
    event.dataTransfer?.setData('text/plain', studentId);
  }

  function handleStudentDragEnd() {
    draggedStudentId = null;
    isDragging = false;
    hoverSeatKey = null;
  }

  function handleSeatDragOver(event: DragEvent, seat: Seat) {
    if (!isEditing) return;
    if (!seat.active) return;

    event.preventDefault();
    hoverSeatKey = seatKey(seat.row, seat.col);
  }

  function handleSeatDragLeave(event: DragEvent, seat: Seat) {
    if (hoverSeatKey === seatKey(seat.row, seat.col)) {
      hoverSeatKey = null;
    }
  }

  function handleSeatDrop(event: DragEvent, seat: Seat) {
    if (!isEditing) return;
    if (!seat.active) return;

    event.preventDefault();

    const studentId = draggedStudentId || event.dataTransfer?.getData('text/plain');
    if (!studentId) return;

    seats.forEach(s => {
      if (s.student_id === studentId) {
        s.student_id = null;
      }
    });

    seat.student_id = studentId;

    seats = seats;

    draggedStudentId = null;
    isDragging = false;
    hoverSeatKey = null;
  }

  function handleStudentListDrop(event: DragEvent) {
    if (!isEditing) return;

    event.preventDefault();
    const studentId = draggedStudentId || event.dataTransfer?.getData('text/plain');
    if (!studentId) return;

    seats.forEach((seat) => {
      if (seat.student_id === studentId) {
        seat.student_id = null;
      }
    });

    seats = seats;

    draggedStudentId = null;
    isDragging = false;
    hoverSeatKey = null;
  }

  function handleStudentListDragOver(event: DragEvent) {
    if (!isEditing) return;
    event.preventDefault();
  }

  function colLetter(col: number) { 
      return String.fromCharCode(64 + col); // 1 → A, 2 → B, 3 → C... 
      }
  
  let lastTapTime = 0;

  function handleSeatTap(row: number, col: number) {
      if(!isEditing) return;

      const now = Date.now();
      const timeSince = now - lastTapTime;

      if (timeSince < 300) {
          toggleSeat(row, col);
      }

      lastTapTime = now;
  }

  function clearAllSeats() {
    seats.forEach(seat => {
      seat.student_id = null;
    });
    seats = seats; // força reatividade
  }

  function applyAutoSeating() {
    if(!students.length) return;

    const hasAssigned = autoSeats.some(s =>s.student_id);
    if (hasAssigned) return;

    const seatsCopy = autoSeats.map(s => ({...s}));

    const sorted = [...students].sort((a, b) => {
      return (a.attend_no ?? 0) - (b.attend_no ?? 0);
    });

    let i = 0;

    for (let c = 1; c <= maxCols; c++) {
      for (let r = 1; r <= maxRows; r++) {
        const seat = seatsCopy.find(s => s.row === r && s.col === c);
        if (!seat || !seat.active) continue;
        if (i >= sorted.length) break;

        seat.student_id = sorted[i].id;
        i++;

      }
    } 
      autoSeats = seatsCopy;


  }

  function applyASeating() {
  if(!students.length) return;

  const hasAssigned = ASeats.some(s => s.student_id);
  if (hasAssigned) return;

  const seatsCopy = ASeats.map(s => ({...s}));

  const sorted = [...students].sort((a, b) => {
    return (a.attend_no ?? 0) - (b.attend_no ?? 0);
  });

  let i = 0;

  for (let c = 1; c <= maxCols; c++) {
    for (let r = 1; r <= maxRows; r++) {
      const seat = seatsCopy.find(s => s.row === r && s.col === c);
      if (!seat || !seat.active) continue;
      if (i >= sorted.length) break;

      seat.student_id = sorted[i].id;
      i++;
    }
  }

  ASeats = seatsCopy;
}

function applyBSeating() {
  if(!students.length) return;

  const hasAssigned = BSeats.some(s => s.student_id);
  if (hasAssigned) return;

  const seatsCopy = BSeats.map(s => ({...s}));

  const sorted = [...students].sort((a, b) => {
    return (a.attend_no ?? 0) - (b.attend_no ?? 0);
  });

  let i = 0;

  for (let c = 1; c <= maxCols; c++) {
    for (let r = 1; r <= maxRows; r++) {
      const seat = seatsCopy.find(s => s.row === r && s.col === c);
      if (!seat || !seat.active) continue;
      if (i >= sorted.length) break;

      seat.student_id = sorted[i].id;
      i++;
    }
  }

  BSeats = seatsCopy;
}

function applyCSeating() {
  if (!students.length) return;

  const hasAssigned = CSeats.some(s => s.student_id);
  if (hasAssigned) return;

  const seatsCopy = CSeats.map(s => ({ ...s }));

  const sorted = [...students].sort((a, b) => {
    return (a.attend_no ?? 0) - (b.attend_no ?? 0);
  });

  let i = 0;

  for (let c = 1; c <= 8; c++) {     // 5 colunas fixas
    for (let r = 1; r <= 5; r++) {   // 8 fileiras fixas
      const seat = seatsCopy.find(s => s.row === r && s.col === c);
      if (!seat || !seat.active) continue;
      if (i >= sorted.length) break;

      seat.student_id = sorted[i].id;
      i++;
    }
  }

  CSeats = seatsCopy;
}



  function applyRandomSeating() {
    if(!isEditing) return;
    if(seatingType !== 'custom') return;
    if(!students.length) return;

    const seatsCopy = customSeats.map(s => ({...s}));

    const shuffled = [...students]
      .sort(() => Math.random() - 0.5);

    let i = 0;

    for (let c = 1; c <= maxCols; c++) {
      for (let r = 1; r <= maxRows; r++) {

        const seat = seatsCopy.find(s => s.row === r && s.col === c);
        if (!seat || !seat.active) continue;

        if (i >= shuffled.length) break;

        seat.student_id = shuffled[i].id;
        i++;

      }
    }

      customSeats = seatsCopy;

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
          class_name: className,
          type: seatingType,
          seats 
        })
      });

      saveMessage = "✔ 保存しました";
      isEditing = false;

      setTimeout(() => {
        saveMessage = "";
      }, 2000);

    } catch (err) {
      console.error("エラー:", err);
      saveMessage = "✘ 保存に失敗しました";
    } finally {
      saving = false;
    }
  }

</script>




<svelte:head>
  <title>座席表</title>
</svelte:head>

<div class="seating-page">
  <header class="seating-header">
    <div class="left">
      <h1>座席表</h1>

      <div class="mode-switch">
        <button
          class:selected={seatingType === 'auto'}
          on:click={() => {
            seatingType = 'auto';
            if(isEditing){
              applyAutoSeating();
            }
          }}
        >
          出席番号順
        </button>

        <button
          class:selected={seatingType === 'custom'}
          on:click={() => seatingType = 'custom'}
        >
          {course === "全" ? "カスタム" : "別室"}
        </button>


        <button
          class:selected={seatingType === 'A'}
          on:click={() => {
          seatingType = 'A';
            if (isEditing) {
              applyASeating();
            }
          }}
        >
        A
        </button>

        <button
          class:selected={seatingType === 'B'}
          on:click={() => {
          seatingType = 'B';
            if (isEditing) {
              applyBSeating();
            }
          }}
        >
        B
        </button>

        <button
          class:selected={seatingType === 'C'}
          on:click={() => {
          seatingType = 'C';
          if (isEditing) {
            applyCSeating();
          }
          }}
        >
        C
        </button>


      

      </div>
    </div>

    <div class="right">
      <button
        class:selected={viewMode === 'teacher'}
        on:click={() => viewMode = 'teacher'}
      >
        教員ビュー
      </button>

      <button
        class:selected={viewMode === 'student'}
        on:click={() => viewMode = 'student'}
      >
        生徒ビュー
      </button>

      <button
        class="random-btn"
        on:click={applyRandomSeating}
        disabled={!isEditing}
      >
        ランダム
      </button>


      {#if !isEditing}
          <button
              class="primary"
              on:click={() => {
                  viewMode = 'student';   // força entrar no student view
                  isEditing = true;       // ativa edição
              }}
          >
              編集
          </button>


      {:else}
          <button on:click={() => isEditing = false}>
              キャンセル
          </button>

          <button on:click={clearAllSeats}>
            全てクリア
          </button>

          <button class="primary" on:click={save}>
            保存
          </button>
          

          <!-- ⬇️ FEEDBACK DO SALVAR -->
          {#if saveMessage}
            <div class="save-feedback">{saveMessage}</div>
          {/if}
          <!-- ⬆️ FEEDBACK DO SALVAR -->

          

      {/if}
    </div>
  </header>

  <main class="seating-main">
    <section class="seating-grid-wrapper">

      {#if viewMode === 'student'}
          <div class="teacher-desk">教卓</div>
      {/if}
    {#if seats.length === maxRows * maxCols}
      <div class="seating-grid">
          {#each Array(maxRows) as _, r}
              <div class="row"
              style={`--cols: ${maxCols}`}
              >
                  {#each Array(maxCols) as _, c}
                      
                      {@const rReal = viewMode === 'teacher' ? maxRows - 1 - r : r}
                      {@const cReal = viewMode === 'teacher' ? maxCols - 1 - c : c}

                      {#key `${rReal}-${cReal}`}
                          <div
                              class={`seat 
                                  ${seats[rReal * maxCols + cReal].active ? 'active' : 'inactive'} 
                                  ${isDragging && seats[rReal * maxCols + cReal].active ? 'drop-ready' : ''} 
                                  ${hoverSeatKey === seatKey(rReal + 1, cReal + 1) ? 'drop-hover' : ''}
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
                                          draggable="true"
                                          on:dragstart={(e) => handleStudentDragStart(e, seats[rReal * maxCols + cReal].student_id)}
                                          on:dragend={handleStudentDragEnd}
                                      >
                                          {studentName(seats[rReal * maxCols + cReal].student_id)}
                                      </span>
                                  {:else}
                                  <span class="seat-number">{rReal + 1}-{colLetter(cReal + 1)}</span>
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



      
    {/if}

      {#if viewMode === 'teacher'}
      <div class="teacher-desk">教卓</div>
      {/if}

     </section>
     
    
 
  


    <aside
      class="student-list-wrapper"
      on:dragover={handleStudentListDragOver}
      on:drop={handleStudentListDrop}
    >
      <h2>生徒一覧</h2>
      <ul class="student-list">
          {#each students.filter(s => !seats.some(seat => seat.student_id === s.id)) as student}
          <li
            class="student-item"
            draggable={isEditing && viewMode === 'student'}
            on:dragstart={(e) => handleStudentDragStart(e, student.id)}
            on:dragend={handleStudentDragEnd}
          >
            {student.attend_no}番 {student.name}
          </li>
        {/each}
      </ul>

      {#if isEditing}
        <p class="hint">
          生徒をドラッグして座席に配置できます。<br>
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
